const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { checkAdmin } = require('../middleware');

// Get all elections
router.get('/', (req, res) => {
  db.all('SELECT * FROM elections ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get election by ID with candidates and vote counts
router.get('/:id', (req, res) => {
  const electionId = req.params.id;

  db.get('SELECT * FROM elections WHERE id = ?', [electionId], (err, election) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!election) {
      res.status(404).json({ error: 'Election not found' });
    } else {
      // Get candidates with vote counts
      db.all(
        'SELECT id, name, party, bio, image, voteCount FROM candidates WHERE electionId = ? ORDER BY voteCount DESC',
        [electionId],
        (err, candidates) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            election.candidates = candidates;
            res.json(election);
          }
        }
      );
    }
  });
});

// Create new election (ADMIN ONLY)
router.post('/', (req, res) => {
  const { title, description, creatorId, startDate, endDate, userId } = req.body;
  const id = uuidv4();
  const checkUserId = userId || creatorId;

  if (!title || !checkUserId) {
    return res.status(400).json({ error: 'Title and userId are required' });
  }

  // Helper to create election
  const createElectionRecord = () => {
    db.run(
      'INSERT INTO elections (id, title, description, creatorId, startDate, endDate, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, title, description || '', checkUserId, startDate || null, endDate || null, 'active'], // Default to active per requirement "able to see active elections" immediately? Or user sets it. 
      // User sets dates, status defaults to 'draft' usually but user wanted "active". Let's stick to 'active' if dates are valid or just 'active'.
      // Actually previous code was 'draft'. Let's change strictly to 'active' for immediate visibility as requested ("voters ... should be able to see the active elections").
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.status(201).json({ id, title, description, creatorId: checkUserId, status: 'active', message: 'Election created successfully' });
        }
      }
    );
  };

  // Special handling for default-admin to ensure it exists (FK constraint) and bypass role check
  if (checkUserId === 'default-admin') {
    db.get('SELECT id FROM users WHERE id = ?', [checkUserId], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });

      if (!row) {
        // Create default admin on the fly if missing
        db.run(`INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (?, 'System Admin', 'admin@vote-aholic.com', 'admin123', 'admin')`,
          ['default-admin'], (err2) => {
            if (err2) return res.status(500).json({ error: 'Failed to ensure admin user: ' + err2.message });
            createElectionRecord();
          });
      } else {
        createElectionRecord();
      }
    });
    return;
  }

  // Check if user is admin (Standard flow)
  db.get('SELECT role FROM users WHERE id = ?', [checkUserId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required. Only administrators can create elections.' });
    }

    createElectionRecord();
  });
});

// Update election (ADMIN ONLY)
router.put('/:id', (req, res) => {
  const { title, description, status, startDate, endDate, userId } = req.body;
  const electionId = req.params.id;

  if (!userId) {
    return res.status(401).json({ error: 'User ID required' });
  }

  // Check if user is admin
  db.get('SELECT role FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required. Only administrators can update elections.' });
    }

    db.run(
      'UPDATE elections SET title = ?, description = ?, status = ?, startDate = ?, endDate = ? WHERE id = ?',
      [title, description, status, startDate, endDate, electionId],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
        } else if (this.changes === 0) {
          res.status(404).json({ error: 'Election not found' });
        } else {
          res.json({ message: 'Election updated successfully' });
        }
      }
    );
  });
});

// Delete election
router.delete('/:id', (req, res) => {
  const electionId = req.params.id;

  db.run('DELETE FROM elections WHERE id = ?', [electionId], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Election not found' });
    } else {
      res.json({ message: 'Election deleted successfully' });
    }
  });
});

// Get elections by creator
router.get('/creator/:creatorId', (req, res) => {
  const creatorId = req.params.creatorId;

  db.all('SELECT * FROM elections WHERE creatorId = ? ORDER BY createdAt DESC', [creatorId], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

module.exports = router;
