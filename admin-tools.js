#!/usr/bin/env node

/**
 * VOTE-AHOLIC Database & Admin Management Tools
 * Usage: node admin-tools.js [command]
 * 
 * Commands:
 *   view-db          - View all database tables
 *   clear-votes      - Clear all votes
 *   reset-db         - Reset entire database
 *   view-elections   - View all elections
 *   view-votes       - View all votes
 *   view-users       - View all users
 *   stats            - Show voting statistics
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'voting.db');
const db = new sqlite3.Database(dbPath);

const command = process.argv[2] || 'help';

// ==================== UTILITY FUNCTIONS ====================

function printHeader(title) {
  console.log('\n' + '═'.repeat(80));
  console.log(`║ ${title.padEnd(76)} ║`);
  console.log('═'.repeat(80) + '\n');
}

function printTable(headers, rows) {
  if (rows.length === 0) {
    console.log('  (No data)');
    return;
  }

  // Calculate column widths
  const widths = headers.map((h, i) => {
    const maxWidth = Math.max(h.length, ...rows.map(r => String(r[i] || '').length));
    return Math.min(maxWidth + 2, 30);
  });

  // Print headers
  const headerRow = headers.map((h, i) => h.padEnd(widths[i])).join('│');
  console.log('┌' + widths.map(w => '─'.repeat(w)).join('┬') + '┐');
  console.log('│' + headerRow + '│');
  console.log('├' + widths.map(w => '─'.repeat(w)).join('┼') + '┤');

  // Print rows
  rows.forEach((row, idx) => {
    const dataRow = headers.map((_, i) => {
      const val = String(row[i] || '').substring(0, widths[i] - 2);
      return val.padEnd(widths[i]);
    }).join('│');
    console.log('│' + dataRow + '│');
  });

  console.log('└' + widths.map(w => '─'.repeat(w)).join('┴') + '┘');
}

// ==================== COMMANDS ====================

function viewElections() {
  printHeader('VIEW: ALL ELECTIONS');
  
  db.all('SELECT id, title, description, status, createdAt FROM elections', (err, rows) => {
    if (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }

    if (rows.length === 0) {
      console.log('No elections in database');
    } else {
      const headers = ['ID', 'Title', 'Description', 'Status', 'Created'];
      const data = rows.map(r => [
        r.id.substring(0, 8),
        r.title.substring(0, 20),
        (r.description || '').substring(0, 15),
        r.status,
        new Date(r.createdAt).toLocaleString().substring(0, 10)
      ]);
      printTable(headers, data);
      console.log(`\n✅ Total: ${rows.length} elections`);
    }

    db.close();
  });
}

function viewVotes() {
  printHeader('VIEW: ALL VOTES');
  
  db.all(`
    SELECT v.id, v.voterId, c.name as candidate, e.title as election, v.votedAt
    FROM votes v
    JOIN candidates c ON v.candidateId = c.id
    JOIN elections e ON v.electionId = e.id
    ORDER BY v.votedAt DESC
  `, (err, rows) => {
    if (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }

    if (rows.length === 0) {
      console.log('No votes in database');
    } else {
      const headers = ['Vote ID', 'Voter ID', 'Candidate', 'Election', 'Time'];
      const data = rows.map(r => [
        r.id.substring(0, 8),
        r.voterId.substring(0, 8),
        r.candidate,
        r.election.substring(0, 20),
        new Date(r.votedAt).toLocaleString().substring(0, 16)
      ]);
      printTable(headers, data);
      console.log(`\n✅ Total: ${rows.length} votes`);
    }

    db.close();
  });
}

function viewUsers() {
  printHeader('VIEW: ALL USERS');
  
  db.all('SELECT id, username, email, role, createdAt FROM users', (err, rows) => {
    if (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }

    if (rows.length === 0) {
      console.log('No users in database');
    } else {
      const headers = ['User ID', 'Username', 'Email', 'Role', 'Created'];
      const data = rows.map(r => [
        r.id.substring(0, 8),
        r.username,
        r.email,
        r.role || 'voter',
        new Date(r.createdAt).toLocaleString().substring(0, 10)
      ]);
      printTable(headers, data);
      console.log(`\n✅ Total: ${rows.length} users`);
    }

    db.close();
  });
}

function viewCandidates() {
  printHeader('VIEW: ALL CANDIDATES');
  
  db.all(`
    SELECT c.id, c.name, c.party, e.title as election, c.voteCount
    FROM candidates c
    JOIN elections e ON c.electionId = e.id
    ORDER BY c.voteCount DESC
  `, (err, rows) => {
    if (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }

    if (rows.length === 0) {
      console.log('No candidates in database');
    } else {
      const headers = ['Candidate ID', 'Name', 'Party', 'Election', 'Votes'];
      const data = rows.map(r => [
        r.id.substring(0, 8),
        r.name,
        r.party || 'N/A',
        r.election.substring(0, 20),
        String(r.voteCount)
      ]);
      printTable(headers, data);
      console.log(`\n✅ Total: ${rows.length} candidates`);
    }

    db.close();
  });
}

function showStats() {
  printHeader('DATABASE STATISTICS');
  
  db.all(`
    SELECT 
      (SELECT COUNT(*) FROM users) as users,
      (SELECT COUNT(*) FROM elections) as elections,
      (SELECT COUNT(*) FROM candidates) as candidates,
      (SELECT COUNT(*) FROM votes) as votes
  `, (err, rows) => {
    if (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }

    const stats = rows[0];
    console.log(`📊 VOTE-AHOLIC Database Statistics\n`);
    console.log(`  Users:       ${stats.users}`);
    console.log(`  Elections:   ${stats.elections}`);
    console.log(`  Candidates:  ${stats.candidates}`);
    console.log(`  Votes Cast:  ${stats.votes}\n`);

    // Election stats
    db.all(`
      SELECT 
        e.title,
        COUNT(DISTINCT c.id) as candidates,
        SUM(c.voteCount) as total_votes
      FROM elections e
      LEFT JOIN candidates c ON e.id = c.electionId
      GROUP BY e.id
    `, (err2, electionStats) => {
      if (!err2 && electionStats.length > 0) {
        console.log('Election Details:\n');
        electionStats.forEach(e => {
          console.log(`  ${e.title}`);
          console.log(`    Candidates: ${e.candidates || 0}`);
          console.log(`    Total Votes: ${e.total_votes || 0}\n`);
        });
      }

      db.close();
    });
  });
}

function clearVotes() {
  printHeader('CLEAR ALL VOTES');
  
  console.log('⚠️  This will delete all votes but keep elections and candidates\n');

  db.serialize(() => {
    db.run('DELETE FROM votes', function(err) {
      if (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
      }
      console.log('✅ Deleted ' + this.changes + ' votes\n');

      // Reset vote counts
      db.run('UPDATE candidates SET voteCount = 0', function(err2) {
        if (err2) {
          console.error('❌ Error:', err2.message);
          process.exit(1);
        }
        console.log('✅ Reset all vote counts\n');
        console.log('✅ Votes cleared successfully!');
        db.close();
      });
    });
  });
}

function resetDatabase() {
  printHeader('RESET ENTIRE DATABASE');
  
  console.log('⚠️  WARNING: This will delete everything and recreate tables!\n');
  console.log('This action cannot be undone.\n');

  db.serialize(() => {
    db.run('DELETE FROM votes', function(err) {
      if (err) console.error('Error deleting votes:', err.message);
      console.log('✅ Cleared votes');

      db.run('DELETE FROM voters', function(err) {
        if (err) console.error('Error deleting voters:', err.message);
        console.log('✅ Cleared voters');

        db.run('DELETE FROM candidates', function(err) {
          if (err) console.error('Error deleting candidates:', err.message);
          console.log('✅ Cleared candidates');

          db.run('DELETE FROM elections', function(err) {
            if (err) console.error('Error deleting elections:', err.message);
            console.log('✅ Cleared elections');

            db.run('DELETE FROM users', function(err) {
              if (err) console.error('Error deleting users:', err.message);
              console.log('✅ Cleared users');
              console.log('\n✅ Database completely reset!\n');
              db.close();
            });
          });
        });
      });
    });
  });
}

function viewDatabase() {
  printHeader('DATABASE OVERVIEW');
  
  db.all('SELECT COUNT(*) as count, "elections" as table_name FROM elections', (err, elections) => {
    if (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }

    db.all('SELECT COUNT(*) as count FROM candidates', (err2, candidates) => {
      db.all('SELECT COUNT(*) as count FROM votes', (err3, votes) => {
        db.all('SELECT COUNT(*) as count FROM users', (err4, users) => {
          console.log('Database File: voting.db');
          console.log('\nTables:');
          console.log(`  ✅ users       - ${users[0].count} records`);
          console.log(`  ✅ elections   - ${elections[0].count} records`);
          console.log(`  ✅ candidates  - ${candidates[0].count} records`);
          console.log(`  ✅ votes       - ${votes[0].count} records`);
          console.log(`  ✅ voters      - (tracking table)`);
          console.log('\n📊 Use commands:');
          console.log('  node admin-tools.js view-elections');
          console.log('  node admin-tools.js view-candidates');
          console.log('  node admin-tools.js view-votes');
          console.log('  node admin-tools.js view-users');
          console.log('  node admin-tools.js stats');
          console.log('  node admin-tools.js clear-votes');
          console.log('  node admin-tools.js reset-db');
          console.log();
          db.close();
        });
      });
    });
  });
}

function showHelp() {
  printHeader('VOTE-AHOLIC DATABASE MANAGEMENT TOOLS');
  
  console.log(`Usage: node admin-tools.js [command]\n`);
  console.log('Commands:');
  console.log('  view-db          - View database overview');
  console.log('  view-elections   - View all elections');
  console.log('  view-candidates  - View all candidates with vote counts');
  console.log('  view-votes       - View all votes');
  console.log('  view-users       - View all users');
  console.log('  stats            - Show voting statistics');
  console.log('  clear-votes      - Clear all votes (keep elections/candidates)');
  console.log('  reset-db         - Reset entire database (DELETE ALL DATA)');
  console.log('  make-admin [username] - Make user an admin');
  console.log('  help             - Show this help message\n');
  
  console.log('Examples:');
  console.log('  node admin-tools.js view-elections');
  console.log('  node admin-tools.js stats');
  console.log('  node admin-tools.js clear-votes');
  console.log('  node admin-tools.js make-admin john_doe\n');
  
  process.exit(0);
}

function makeAdmin() {
  const username = process.argv[3];
  
  if (!username) {
    console.log('❌ Username required\n');
    console.log('Usage: node admin-tools.js make-admin [username]\n');
    console.log('Example: node admin-tools.js make-admin john_doe\n');
    process.exit(1);
  }

  printHeader('MAKE USER ADMIN');
  
  db.run('UPDATE users SET role = ? WHERE username = ?', ['admin', username], function(err) {
    if (err) {
      console.error('❌ Error:', err.message);
      process.exit(1);
    }

    if (this.changes === 0) {
      console.log(`❌ User not found: ${username}`);
      process.exit(1);
    }

    console.log(`✅ User '${username}' is now an admin!\n`);
    db.close();
  });
}

// ==================== MAIN ====================

switch(command.toLowerCase()) {
  case 'view-db':
    viewDatabase();
    break;
  case 'view-elections':
    viewElections();
    break;
  case 'view-candidates':
    viewCandidates();
    break;
  case 'view-votes':
    viewVotes();
    break;
  case 'view-users':
    viewUsers();
    break;
  case 'stats':
    showStats();
    break;
  case 'clear-votes':
    clearVotes();
    break;
  case 'reset-db':
    resetDatabase();
    break;
  case 'make-admin':
    makeAdmin();
    break;
  case 'help':
    showHelp();
    break;
  default:
    console.log(`❌ Unknown command: ${command}\n`);
    showHelp();
}
