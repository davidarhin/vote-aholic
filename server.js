const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./db');

// Import routes
const electionsRouter = require('./routes/elections');
const candidatesRouter = require('./routes/candidates');
const votesRouter = require('./routes/votes');
const usersRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname)));

// API Routes
app.use('/api/elections', electionsRouter);
app.use('/api/candidates', candidatesRouter);
app.use('/api/votes', votesRouter);
app.use('/api/users', usersRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running', timestamp: new Date() });
});

// Serve the frontend HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Voters.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n╔════════════════════════════════════╗`);
  console.log(`║   VOTE-AHOLIC API Server Started   ║`);
  console.log(`║   http://localhost:${PORT}            ║`);
  console.log(`╚════════════════════════════════════╝\n`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/elections');
  console.log('  POST /api/elections');
  console.log('  GET  /api/elections/:id');
  console.log('  POST /api/candidates');
  console.log('  GET  /api/candidates/election/:electionId');
  console.log('  POST /api/votes');
  console.log('  GET  /api/votes/results/:electionId');
  console.log('  POST /api/users');
  console.log('\nDatabase: voting.db');
});

module.exports = app;
