# VOTE-AHOLIC Full Stack Setup Guide

## 🚀 Quick Start

### Step 1: Install Node.js Packages
Open a terminal in the project directory and run:
```bash
npm install
```

This will install:
- `express` - Web framework
- `sqlite3` - Database
- `cors` - Cross-origin requests
- `body-parser` - JSON parsing
- `uuid` - ID generation
- `nodemon` - Development auto-reload

### Step 2: Start the Backend Server
```bash
npm start
```

You should see:
```
╔════════════════════════════════════╗
║   VOTE-AHOLIC API Server Started   ║
║   http://localhost:5000            ║
╚════════════════════════════════════╝
```

**The database file `voting.db` will be auto-created on first run.**

### Step 3: Open the Frontend
Open your browser and navigate to:
```
http://localhost:5000
```

You should see the VOTE-AHOLIC voting interface with full backend connectivity.

---

## 📁 Project Structure

```
vote-aholic/
├── server.js                    # Main Express server
├── db.js                       # Database initialization (SQLite)
├── api.js                      # Frontend API client
├── FRONTEND.html               # Web interface
├── package.json                # Dependencies
├── voting.db                   # SQLite database (auto-created)
├── README.md                   # Full API documentation
├── routes/
│   ├── elections.js            # Election CRUD endpoints
│   ├── candidates.js           # Candidate management endpoints
│   ├── votes.js               # Voting and results endpoints
│   └── users.js               # User authentication endpoints
└── SETUP.md                    # This file
```

---

## 💾 Database Schema

The SQLite database has 5 tables:

### Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  createdAt DATETIME
)
```

### Elections Table
```sql
CREATE TABLE elections (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  creatorId TEXT (foreign key),
  startDate DATETIME,
  endDate DATETIME,
  status TEXT (draft/active/closed),
  createdAt DATETIME
)
```

### Candidates Table
```sql
CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  electionId TEXT (foreign key),
  name TEXT,
  party TEXT,
  bio TEXT,
  image TEXT,
  voteCount INTEGER,
  createdAt DATETIME
)
```

### Votes Table
```sql
CREATE TABLE votes (
  id TEXT PRIMARY KEY,
  electionId TEXT (foreign key),
  candidateId TEXT (foreign key),
  voterId TEXT (foreign key),
  votedAt DATETIME
)
```

### Voters Table
```sql
CREATE TABLE voters (
  id TEXT PRIMARY KEY,
  electionId TEXT (foreign key),
  userId TEXT (foreign key),
  hasVoted INTEGER,
  votedAt DATETIME
)
```

---

## 🔌 API Endpoints

### Base URL: `http://localhost:5000/api`

#### Elections
- `GET /elections` - Get all elections
- `POST /elections` - Create new election
- `GET /elections/:id` - Get election with candidates
- `PUT /elections/:id` - Update election
- `DELETE /elections/:id` - Delete election
- `GET /elections/creator/:creatorId` - Get user's elections

#### Candidates
- `POST /candidates` - Add candidate
- `GET /candidates/election/:electionId` - Get candidates
- `PUT /candidates/:id` - Update candidate
- `DELETE /candidates/:id` - Delete candidate

#### Votes
- `POST /votes` - Cast a vote
- `GET /votes/results/:electionId` - Get results
- `GET /votes/check/:electionId/:voterId` - Check if voted
- `GET /votes/election/:electionId` - Get all votes

#### Users
- `POST /users` - Create user
- `POST /users/login` - Login user
- `GET /users/:id` - Get user info
- `POST /users/election/join` - Add user to election

#### Health Check
- `GET /api/health` - Check if API is running

---

## 🔧 Frontend Integration

The `api.js` file provides all functions to interact with the backend:

```javascript
// User Functions
registerUser(username, email, password)
loginUser(email, password)
logoutUser()
loadUserSession()

// Election Functions
createElection(title, description, startDate, endDate)
getAllElections()
getElectionById(electionId)
getCreatorElections()
updateElection(electionId, title, description, status, startDate, endDate)
deleteElection(electionId)

// Candidate Functions
addCandidate(electionId, name, party, bio, image)
getCandidatesByElection(electionId)
updateCandidate(candidateId, name, party, bio, image)
deleteCandidate(candidateId)

// Voting Functions
castVote(electionId, candidateId)
checkIfVoted(electionId)
getElectionResults(electionId)
getElectionVotes(electionId)

// Utility
checkApiHealth()
```

---

## 📝 Example Usage

### Create an Election
```javascript
const result = await createElection(
  "City Mayor Election 2025",
  "Vote for your favorite mayor candidate",
  "2025-01-20",
  "2025-01-27"
);
if (result.success) {
  console.log("Election created:", result.data);
  const electionId = result.data.id;
}
```

### Add Candidates
```javascript
await addCandidate(
  electionId,
  "John Smith",
  "Democratic Party",
  "Experienced mayor with 10 years of service",
  "https://example.com/john.jpg"
);
```

### Cast a Vote
```javascript
const voteResult = await castVote(electionId, candidateId);
if (voteResult.success) {
  alert("Vote recorded successfully!");
} else {
  alert("Error: " + voteResult.error);
}
```

### Get Results
```javascript
const results = await getElectionResults(electionId);
console.log(results.data); // { candidates: [...], totalVotes: 150 }
```

---

## 🚨 Troubleshooting

### "Cannot connect to API"
1. Make sure the backend server is running: `npm start`
2. Check that port 5000 is available
3. Verify database permissions
4. Check browser console for errors

### Database locked error
- Stop the server
- Delete `voting.db-wal` and `voting.db-shm` files
- Restart the server

### Port 5000 already in use
```bash
# Change port in server.js
const PORT = process.env.PORT || 5001;
```

### CORS errors
- Ensure `cors` middleware is enabled in server.js
- Check API_BASE_URL in api.js matches the server URL

---

## 📚 Development Tips

### Using nodemon for auto-reload
```bash
npm run dev
```
This automatically restarts the server when files change.

### View Database Contents
Use any SQLite viewer or browser extension to inspect `voting.db`

### Enable Logging
Add console.log statements in routes for debugging:
```javascript
router.post('/', (req, res) => {
  console.log('Request body:', req.body);
  // ... rest of code
});
```

### Test API with cURL
```bash
curl http://localhost:5000/api/health
curl -X POST http://localhost:5000/api/elections \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","creatorId":"user1"}'
```

---

## ✅ Features Included

✅ Complete REST API
✅ SQLite Database with 5 tables
✅ User Authentication (basic)
✅ Election Management (CRUD)
✅ Candidate Management
✅ Vote Casting with Duplicate Prevention
✅ Real-time Vote Counting
✅ Election Results API
✅ CORS Enabled
✅ Frontend Integration
✅ Auto-reload in Dev Mode
✅ Error Handling

---

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Review the API endpoints in README.md
3. Verify database connectivity in db.js
4. Check FRONTEND.html console for JavaScript errors

---

Happy Voting! 🗳️
