# VOTE-AHOLIC Backend API

A complete Node.js backend API for the VOTE-AHOLIC online voting system with SQLite database.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Database

The backend uses **SQLite** with the following tables:
- `users` - User accounts
- `elections` - Voting elections/events
- `candidates` - Candidates in elections
- `votes` - Individual votes cast
- `voters` - Track eligible voters per election

Database file: `voting.db` (auto-created)

## API Endpoints

### Elections
- `GET /api/elections` - Get all elections
- `GET /api/elections/:id` - Get election with candidates
- `POST /api/elections` - Create new election
- `PUT /api/elections/:id` - Update election
- `DELETE /api/elections/:id` - Delete election
- `GET /api/elections/creator/:creatorId` - Get creator's elections

### Candidates
- `POST /api/candidates` - Add candidate to election
- `GET /api/candidates/election/:electionId` - Get candidates by election
- `PUT /api/candidates/:id` - Update candidate
- `DELETE /api/candidates/:id` - Delete candidate

### Votes
- `POST /api/votes` - Cast a vote
- `GET /api/votes/results/:electionId` - Get election results
- `GET /api/votes/check/:electionId/:voterId` - Check if user voted
- `GET /api/votes/election/:electionId` - Get all votes for election

### Users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user info
- `POST /api/users/login` - Login user
- `POST /api/users/election/join` - Add user to election

## Example Usage

### Create an Election
```javascript
POST /api/elections
{
  "title": "Presidential Election 2025",
  "description": "Vote for your favorite candidate",
  "creatorId": "user-123",
  "startDate": "2025-01-20",
  "endDate": "2025-01-27"
}
```

### Add a Candidate
```javascript
POST /api/candidates
{
  "electionId": "election-123",
  "name": "John Doe",
  "party": "Democratic Party",
  "bio": "Experienced politician...",
  "image": "url-to-image"
}
```

### Cast a Vote
```javascript
POST /api/votes
{
  "electionId": "election-123",
  "candidateId": "candidate-456",
  "voterId": "voter-789"
}
```

## Project Structure
```
vote-aholic/
├── server.js              # Main server file
├── db.js                  # Database initialization
├── package.json           # Dependencies
├── voting.db              # SQLite database (auto-created)
├── routes/
│   ├── elections.js       # Election endpoints
│   ├── candidates.js      # Candidate endpoints
│   ├── votes.js           # Voting endpoints
│   └── users.js           # User endpoints
└── FRONTEND.html          # Frontend application
```

## Features
✓ Create and manage elections
✓ Add candidates to elections
✓ Cast votes (with duplicate vote prevention)
✓ Real-time vote counting
✓ View election results
✓ User authentication (basic)
✓ CORS enabled for frontend access

## Environment
- **Runtime:** Node.js
- **Database:** SQLite3
- **Framework:** Express.js
- **Port:** 5000 (default)
