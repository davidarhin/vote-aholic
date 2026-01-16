const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Get all users (admin)
router.get('/', (req, res) => {
  db.all('SELECT id, username, email, role, createdAt FROM users', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

// Create a new user (default role is 'voter')
router.post('/', (req, res) => {
  const { username, email, password, role } = req.body;
  const id = uuidv4();
  const userRole = role === 'admin' ? 'admin' : 'voter';

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'username, email, and password are required' });
  }

  // Hash the password
  bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ error: 'Error hashing password' });
    }

    db.run(
      'INSERT INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, username, email, hashedPassword, userRole],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            res.status(400).json({ error: 'Username or email already exists' });
          } else {
            res.status(500).json({ error: err.message });
          }
        } else {
          res.status(201).json({ id, username, email, role: userRole });
        }
      }
    );
  });
});

// Get user by ID (includes role)
router.get('/:id', (req, res) => {
  const userId = req.params.id;

  db.get('SELECT id, username, email, role, createdAt FROM users WHERE id = ?', [userId], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(row);
    }
  });
});

// Login user
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  db.get('SELECT id, username, email, role, password FROM users WHERE email = ?', [email], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare provided password with stored hashed password
    bcrypt.compare(password, row.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Error verifying password' });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Return user info (without password)
      res.json({
        message: 'Login successful',
        user: {
          id: row.id,
          username: row.username,
          email: row.email,
          role: row.role
        }
      });
    });
  });
});

// Add user to an election (as a voter)
router.post('/election/join', (req, res) => {
  const { electionId, userId } = req.body;
  const id = uuidv4();

  if (!electionId || !userId) {
    return res.status(400).json({ error: 'electionId and userId are required' });
  }

  db.run(
    'INSERT OR IGNORE INTO voters (id, electionId, userId, hasVoted) VALUES (?, ?, ?, ?)',
    [id, electionId, userId, 0],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ message: 'User added to election' });
      }
    }
  );
});

module.exports = router;
