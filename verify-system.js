#!/usr/bin/env node

/**
 * VOTE-AHOLIC System Verification Script
 * Tests all components to ensure system is working correctly
 */

const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const API_BASE = 'http://localhost:3001/api';
const dbPath = path.join(__dirname, 'voting.db');

let testsPassed = 0;
let testsFailed = 0;

// ==================== UTILITIES ====================

function printHeader(title) {
  console.log('\n' + '═'.repeat(70));
  console.log(`║ ${title.padEnd(68)} ║`);
  console.log('═'.repeat(70));
}

function testSuccess(testName) {
  console.log(`  ✅ ${testName}`);
  testsPassed++;
}

function testFailed(testName, error) {
  console.log(`  ❌ ${testName}`);
  console.log(`     Error: ${error}`);
  testsFailed++;
}

function testInfo(message) {
  console.log(`  ℹ️  ${message}`);
}

function httpRequest(method, url, postData = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: method,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.abort();
      reject(new Error('Request timeout'));
    });

    if (postData) {
      req.write(JSON.stringify(postData));
    }

    req.end();
  });
}

// ==================== TESTS ====================

async function testApiHealth() {
  printHeader('TEST 1: API Health Check');
  try {
    const response = await httpRequest('GET', `${API_BASE}/health`);
    
    if (response.status === 200) {
      testSuccess('API server is responding');
      testInfo(`Response: ${response.data.status}`);
    } else {
      testFailed('API server health', `Unexpected status: ${response.status}`);
    }
  } catch (error) {
    testFailed('API server health', error.message);
  }
}

function testDatabase() {
  printHeader('TEST 2: Database Verification');
  
  return new Promise((resolve) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        testFailed('Database connection', err.message);
        resolve();
        return;
      }

      testSuccess('Database file accessible');

      // Check tables
      db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, tables) => {
        if (err) {
          testFailed('Table check', err.message);
          db.close();
          resolve();
          return;
        }

        const expectedTables = ['users', 'elections', 'candidates', 'votes', 'voters'];
        const foundTables = tables.map(t => t.name);

        const allFound = expectedTables.every(t => foundTables.includes(t));
        if (allFound) {
          testSuccess('All 5 tables exist');
          testInfo(`Tables: ${foundTables.join(', ')}`);
        } else {
          const missing = expectedTables.filter(t => !foundTables.includes(t));
          testFailed('Table verification', `Missing: ${missing.join(', ')}`);
        }

        // Count records
        db.all(`
          SELECT 
            (SELECT COUNT(*) as count FROM users) as users,
            (SELECT COUNT(*) as count FROM elections) as elections,
            (SELECT COUNT(*) as count FROM candidates) as candidates,
            (SELECT COUNT(*) as count FROM votes) as votes
        `, (err, result) => {
          if (!err && result.length > 0) {
            const counts = result[0];
            testInfo(`Records: Users=${counts.users}, Elections=${counts.elections}, Candidates=${counts.candidates}, Votes=${counts.votes}`);
          }

          db.close();
          resolve();
        });
      });
    });
  });
}

async function testApiEndpoints() {
  printHeader('TEST 3: API Endpoints');
  
  const endpoints = [
    { method: 'GET', path: '/elections', name: 'GET /elections' },
    { method: 'GET', path: '/candidates', name: 'GET /candidates' },
    { method: 'GET', path: '/users', name: 'GET /users' },
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await httpRequest(endpoint.method, `${API_BASE}${endpoint.path}`);
      if (response.status === 200 || response.status === 201) {
        testSuccess(`${endpoint.name} - Status ${response.status}`);
      } else {
        testFailed(`${endpoint.name} - Status ${response.status}`);
      }
    } catch (error) {
      testFailed(`${endpoint.name}`, error.message);
    }
  }
}

async function testVoteClearEndpoint() {
  printHeader('TEST 4: Vote Clear Endpoint');
  
  try {
    const response = await httpRequest('POST', `${API_BASE}/votes/admin/clear`, {});
    if (response.status === 200 || response.status === 201) {
      testSuccess('POST /votes/admin/clear - Vote clear endpoint exists');
      testInfo(`Response: ${response.data.message || 'Success'}`);
    } else {
      testFailed('Vote clear endpoint', `Status: ${response.status}`);
    }
  } catch (error) {
    testFailed('Vote clear endpoint', error.message);
  }
}

async function testFileSystem() {
  printHeader('TEST 5: File System');
  
  const fs = require('fs');
  const requiredFiles = [
    { name: 'FRONTEND.html', file: path.join(__dirname, 'FRONTEND.html') },
    { name: 'admin.html', file: path.join(__dirname, 'admin.html') },
    { name: 'admin-tools.js', file: path.join(__dirname, 'admin-tools.js') },
    { name: 'server.js', file: path.join(__dirname, 'server.js') },
    { name: 'db.js', file: path.join(__dirname, 'db.js') },
    { name: 'package.json', file: path.join(__dirname, 'package.json') },
  ];

  for (const file of requiredFiles) {
    if (fs.existsSync(file.file)) {
      testSuccess(`File exists: ${file.name}`);
    } else {
      testFailed(`File exists: ${file.name}`, 'File not found');
    }
  }
}

// ==================== REPORT ====================

async function generateReport() {
  printHeader('VOTE-AHOLIC System Verification');
  console.log(`\nTesting system components...\n`);

  await testApiHealth();
  await testDatabase();
  await testApiEndpoints();
  await testVoteClearEndpoint();
  await testFileSystem();

  // Summary
  printHeader('Test Summary');
  console.log(`\n  ✅ Passed: ${testsPassed}`);
  console.log(`  ❌ Failed: ${testsFailed}`);
  
  const total = testsPassed + testsFailed;
  const percentage = Math.round((testsPassed / total) * 100);
  
  console.log(`\n  Overall: ${percentage}% (${testsPassed}/${total})`);

  if (testsFailed === 0) {
    console.log(`\n  🎉 All tests passed! System is fully operational!\n`);
  } else if (testsFailed <= 2) {
    console.log(`\n  ⚠️  Minor issues detected. Please review above.\n`);
  } else {
    console.log(`\n  ❌ Multiple issues found. Check configuration.\n`);
  }

  console.log('═'.repeat(70) + '\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

// ==================== MAIN ====================

console.log('\n🗳️  VOTE-AHOLIC System Verification\n');
console.log('Starting tests...');

generateReport().catch(error => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
