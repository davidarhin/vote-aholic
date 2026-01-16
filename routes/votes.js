const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

// Get all votes
router.get('/', (req, res) => {
  db.all(`
    SELECT v.id, v.electionId, v.candidateId, v.voterId, v.votedAt, c.name, e.title as election
    FROM votes v
    LEFT JOIN candidates c ON v.candidateId = c.id
    LEFT JOIN elections e ON v.electionId = e.id
    ORDER BY v.votedAt DESC
  `, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows || []);
    }
  });
});

// Cast a vote
router.post('/', (req, res) => {
  const { electionId, candidateId, voterId } = req.body;
  const id = uuidv4();

  if (!electionId || !candidateId || !voterId) {
    return res.status(400).json({ error: 'electionId, candidateId, and voterId are required' });
  }

  // First, check if election is active
  db.get(
    'SELECT status FROM elections WHERE id = ?',
    [electionId],
    (err, election) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!election) {
        return res.status(404).json({ error: 'Election not found' });
      }

      if (election.status !== 'active') {
        return res.status(400).json({ error: `Election is not active. Current status: ${election.status}. Voting is only allowed in active elections.` });
      }

      // Check if voter has already voted in this election
      db.get(
        'SELECT * FROM votes WHERE electionId = ? AND voterId = ?',
        [electionId, voterId],
        (err, existingVote) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          if (existingVote) {
            return res.status(400).json({ error: 'You have already voted in this election' });
          }

          // Record the vote
          db.run(
            'INSERT INTO votes (id, electionId, candidateId, voterId) VALUES (?, ?, ?, ?)',
            [id, electionId, candidateId, voterId],
            function (err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Increment candidate vote count
              db.run(
                'UPDATE candidates SET voteCount = voteCount + 1 WHERE id = ?',
                [candidateId],
                (err) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  // Update voter status
                  db.run(
                    'UPDATE voters SET hasVoted = 1, votedAt = CURRENT_TIMESTAMP WHERE electionId = ? AND userId = ?',
                    [electionId, voterId],
                    (err) => {
                      if (err) {
                        return res.status(500).json({ error: err.message });
                      }

                      res.status(201).json({ id, electionId, candidateId, voterId, message: 'Vote recorded successfully' });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get vote results for an election
router.get('/results/:electionId', (req, res) => {
  const electionId = req.params.electionId;

  db.all(
    `SELECT 
      c.id,
      c.name,
      c.party,
      c.voteCount,
      COUNT(v.id) as votes
    FROM candidates c
    LEFT JOIN votes v ON c.id = v.candidateId
    WHERE c.electionId = ?
    GROUP BY c.id
    ORDER BY c.voteCount DESC`,
    [electionId],
    (err, rows) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        const totalVotes = rows.reduce((sum, row) => sum + row.voteCount, 0);
        res.json({ candidates: rows, totalVotes });
      }
    }
  );
});

// Check if user has voted in an election
router.get('/check/:electionId/:voterId', (req, res) => {
  const { electionId, voterId } = req.params;

  db.get(
    'SELECT * FROM votes WHERE electionId = ? AND voterId = ?',
    [electionId, voterId],
    (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ hasVoted: !!row });
      }
    }
  );
});

// Get all votes for an election
router.get('/election/:electionId', (req, res) => {
  const electionId = req.params.electionId;

  db.all(
    `SELECT v.id, v.candidateId, v.voterId, v.votedAt, c.name, c.voteCount
    FROM votes v
    JOIN candidates c ON v.candidateId = c.id
    WHERE v.electionId = ?
    ORDER BY v.votedAt DESC`,
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

// Clear/Reset all votes (ADMIN ONLY - Auth Removed per request)
router.post('/admin/clear', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM votes', (err1) => {
      if (err1) {
        return res.status(500).json({ error: 'Failed to clear votes: ' + err1.message });
      }

      // Reset all vote counts
      db.run('UPDATE candidates SET voteCount = 0', (err2) => {
        if (err2) {
          return res.status(500).json({ error: 'Failed to reset counts: ' + err2.message });
        }

        // Reset voter status
        db.run('UPDATE voters SET hasVoted = 0, votedAt = NULL', (err3) => {
          if (err3) {
            return res.status(500).json({ error: 'Failed to reset voters: ' + err3.message });
          }

          res.json({ message: 'All votes cleared successfully' });
        });
      });
    });
  });
});

// Clear votes for a specific election (ADMIN ONLY - Auth Removed per request)
router.post('/admin/clear/:electionId', (req, res) => {
  const electionId = req.params.electionId;

  db.serialize(() => {
    db.run('DELETE FROM votes WHERE electionId = ?', [electionId], (err1) => {
      if (err1) {
        return res.status(500).json({ error: 'Failed to clear votes: ' + err1.message });
      }

      // Reset vote counts for this election
      db.run('UPDATE candidates SET voteCount = 0 WHERE electionId = ?', [electionId], (err2) => {
        if (err2) {
          return res.status(500).json({ error: 'Failed to reset counts: ' + err2.message });
        }

        res.json({ message: `Votes cleared for election ${electionId}` });
      });
    });
  });
});

// Delete a specific vote
router.delete('/:id', (req, res) => {
  const voteId = req.params.id;

  db.get('SELECT candidateId, electionId FROM votes WHERE id = ?', [voteId], (err, vote) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!vote) return res.status(404).json({ error: 'Vote not found' });

    db.serialize(() => {
      // 1. Delete the vote
      db.run('DELETE FROM votes WHERE id = ?', [voteId], (err) => {
        if (err) return res.status(500).json({ error: 'Failed to delete vote' });

        // 2. Decrement candidate vote count
        db.run('UPDATE candidates SET voteCount = voteCount - 1 WHERE id = ?', [vote.candidateId]);

        // 3. Optional: Reset voter's status if they can vote again (depending on logic, usually 1 vote per election)
        // For now, we just remove the record. If we want to allow re-voting, we'd need to update the `voters` table too if we tracked it there.
        // Assuming `votes` table existence implies a vote was cast.

        res.json({ message: 'Vote deleted successfully' });
      });
    });
  });
});

module.exports = router;
