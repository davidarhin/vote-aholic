#!/usr/bin/env node

/**
 * VOTE-AHOLIC API Example Usage
 * Run this file to see example API calls and responses
 * Usage: node examples.js
 */

const http = require('http');
const API_URL = 'http://localhost:5000/api';

// Utility function to make API calls
function apiCall(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(responseData)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Main example function
async function runExamples() {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║  VOTE-AHOLIC API Example Usage        ║');
  console.log('║  Make sure backend is running!        ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // 1. Check API Health
    console.log('1️⃣  Checking API Health...');
    let response = await apiCall('GET', '/health');
    console.log('   Status:', response.status);
    console.log('   Response:', response.data);

    // 2. Create a user
    console.log('\n2️⃣  Creating a User...');
    response = await apiCall('POST', '/users', {
      username: 'john_voter',
      email: 'john@example.com',
      password: 'securepass123'
    });
    console.log('   Status:', response.status);
    const userId = response.data.id;
    console.log('   User ID:', userId);

    // 3. Create an election
    console.log('\n3️⃣  Creating an Election...');
    response = await apiCall('POST', '/elections', {
      title: 'City Council Election 2025',
      description: 'Vote for your favorite council member',
      creatorId: userId,
      startDate: '2025-01-20',
      endDate: '2025-01-27'
    });
    console.log('   Status:', response.status);
    const electionId = response.data.id;
    console.log('   Election ID:', electionId);

    // 4. Add candidates
    console.log('\n4️⃣  Adding Candidates...');
    const candidates = [
      { name: 'Alice Johnson', party: 'Democratic', bio: 'Community organizer' },
      { name: 'Bob Smith', party: 'Republican', bio: 'Business owner' },
      { name: 'Carol Williams', party: 'Independent', bio: 'Teacher and advocate' }
    ];

    let candidateIds = [];
    for (const candidate of candidates) {
      response = await apiCall('POST', '/candidates', {
        electionId,
        name: candidate.name,
        party: candidate.party,
        bio: candidate.bio,
        image: ''
      });
      candidateIds.push(response.data.id);
      console.log(`   ✓ Added ${candidate.name}`);
    }

    // 5. Get election details
    console.log('\n5️⃣  Getting Election Details...');
    response = await apiCall('GET', `/elections/${electionId}`);
    console.log('   Status:', response.status);
    console.log('   Title:', response.data.title);
    console.log('   Candidates:', response.data.candidates.map(c => c.name).join(', '));

    // 6. Cast votes
    console.log('\n6️⃣  Casting Votes...');
    response = await apiCall('POST', '/votes', {
      electionId,
      candidateId: candidateIds[0],
      voterId: userId
    });
    console.log('   Status:', response.status);
    console.log('   Message:', response.data.message || response.data.error);

    // 7. Get election results
    console.log('\n7️⃣  Getting Election Results...');
    response = await apiCall('GET', `/votes/results/${electionId}`);
    console.log('   Status:', response.status);
    console.log('   Total Votes:', response.data.totalVotes);
    console.log('   Results:');
    response.data.candidates.forEach(c => {
      console.log(`     - ${c.name}: ${c.voteCount} votes`);
    });

    // 8. Check if voter already voted
    console.log('\n8️⃣  Checking Vote Status...');
    response = await apiCall('GET', `/votes/check/${electionId}/${userId}`);
    console.log('   Status:', response.status);
    console.log('   Already Voted:', response.data.hasVoted);

    // 9. Get all elections
    console.log('\n9️⃣  Getting All Elections...');
    response = await apiCall('GET', '/elections');
    console.log('   Status:', response.status);
    console.log('   Total Elections:', response.data.length);

    // 10. Get creator's elections
    console.log('\n🔟 Getting Creator\'s Elections...');
    response = await apiCall('GET', `/elections/creator/${userId}`);
    console.log('   Status:', response.status);
    console.log('   Elections Created by User:', response.data.length);

    console.log('\n╔════════════════════════════════════════╗');
    console.log('║  All Examples Completed Successfully! ║');
    console.log('╚════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nMake sure the backend server is running:');
    console.log('  npm start');
  }
}

// Run examples
runExamples();
