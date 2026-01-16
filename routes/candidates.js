const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get all candidates
router.get('/', (req, res) => {
  db.all(
    'SELECT c.*, e.title as electionTitle FROM candidates c JOIN elections e ON c.electionId = e.id ORDER BY c.voteCount DESC',
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows || []);
      }
    }
  );
});

// Add candidate to election
router.post('/', (req, res) => {
  const { electionId, name, party, bio, image } = req.body;
  const id = uuidv4();

  if (!electionId || !name) {
    return res.status(400).json({ error: 'electionId and name are required' });
  }

  db.run(
    'INSERT INTO candidates (id, electionId, name, party, bio, image, voteCount) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, electionId, name, party || '', bio || '', image || '', 0],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(201).json({ id, electionId, name, party, bio, image, voteCount: 0 });
      }
    }
  );
});

// Get candidates by election
router.get('/election/:electionId', (req, res) => {
  const electionId = req.params.electionId;

  db.all(
    'SELECT * FROM candidates WHERE electionId = ? ORDER BY voteCount DESC',
    [electionId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(rows);
      }
    }
  );
});

// Update candidate
router.put('/:id', (req, res) => {
  const { name, party, bio, image } = req.body;
  const candidateId = req.params.id;

  db.run(
    'UPDATE candidates SET name = ?, party = ?, bio = ?, image = ? WHERE id = ?',
    [name, party, bio, image, candidateId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else if (this.changes === 0) {
        res.status(404).json({ error: 'Candidate not found' });
      } else {
        res.json({ message: 'Candidate updated successfully' });
      }
    }
  );
});

// Delete candidate
router.delete('/:id', (req, res) => {
  const candidateId = req.params.id;

  db.run('DELETE FROM candidates WHERE id = ?', [candidateId], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes === 0) {
      res.status(404).json({ error: 'Candidate not found' });
    } else {
      res.json({ message: 'Candidate deleted successfully' });
    }
  });
});

module.exports = router;
