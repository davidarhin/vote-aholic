const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'voting.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'voter',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.log('Note:', err.message);
      } else {
        // Add role column if it doesn't exist (migration)
        db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'voter'`, (err) => {
          if (err && !err.message.includes('duplicate column')) {
            console.log('Migration note:', err.message);
          }
        });
      }
    });

    // Elections table
    db.run(`CREATE TABLE IF NOT EXISTS elections (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      creatorId TEXT NOT NULL,
      startDate DATETIME,
      endDate DATETIME,
      status TEXT DEFAULT 'draft',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(creatorId) REFERENCES users(id)
    )`);

    // Candidates table
    db.run(`CREATE TABLE IF NOT EXISTS candidates (
      id TEXT PRIMARY KEY,
      electionId TEXT NOT NULL,
      name TEXT NOT NULL,
      party TEXT,
      bio TEXT,
      image TEXT,
      voteCount INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(electionId) REFERENCES elections(id) ON DELETE CASCADE
    )`);

    // Votes table
    db.run(`CREATE TABLE IF NOT EXISTS votes (
      id TEXT PRIMARY KEY,
      electionId TEXT NOT NULL,
      candidateId TEXT NOT NULL,
      voterId TEXT NOT NULL,
      votedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(electionId, voterId),
      FOREIGN KEY(electionId) REFERENCES elections(id) ON DELETE CASCADE,
      FOREIGN KEY(candidateId) REFERENCES candidates(id) ON DELETE CASCADE,
      FOREIGN KEY(voterId) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Voters (for tracking who can vote in an election)
    db.run(`CREATE TABLE IF NOT EXISTS voters (
      id TEXT PRIMARY KEY,
      electionId TEXT NOT NULL,
      userId TEXT NOT NULL,
      hasVoted INTEGER DEFAULT 0,
      votedAt DATETIME,
      UNIQUE(electionId, userId),
      FOREIGN KEY(electionId) REFERENCES elections(id) ON DELETE CASCADE,
      FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
    )`);

    // Seed default admin for "No Login" functionality
    const adminId = 'default-admin';
    const adminEmail = 'admin@vote-aholic.com';
    // Hashed password for 'admin123'
    const adminHash = '$2b$10$w/uVvX.rS4.d3.w.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x';
    // We'll use a simple insert-ignore like approach
    db.run(`INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (?, 'System Admin', ?, 'admin123', 'admin')`,
      [adminId, adminEmail], (err) => {
        if (!err) console.log('Default admin user verified');
      });

    console.log('Database tables initialized');
  });
}

module.exports = db;
