# ⚡ VOTE-AHOLIC Quick Reference Card

## 🚀 Start Here (Copy & Paste)

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open in browser
http://localhost:5000
```

---

## 📂 What Was Created

| File | Purpose | Lines |
|------|---------|-------|
| **server.js** | Main Express server | 60 |
| **db.js** | SQLite database setup | 70 |
| **api.js** | Frontend API client | 300+ |
| **routes/elections.js** | Election endpoints | 100 |
| **routes/candidates.js** | Candidate endpoints | 80 |
| **routes/votes.js** | Voting endpoints | 100 |
| **routes/users.js** | User endpoints | 80 |
| **package.json** | Dependencies | 25 |
| **README.md** | Full API docs | 200+ |
| **SETUP.md** | Setup guide | 300+ |
| **DEPLOYMENT.md** | Complete guide | 400+ |
| **examples.js** | Working examples | 200+ |

**Total:** 12 files, 1800+ lines of code

---

## 🔌 API Endpoints (18 Total)

### Elections (6)
```
POST   /api/elections                          Create
GET    /api/elections                          List all
GET    /api/elections/:id                      Get one
PUT    /api/elections/:id                      Update
DELETE /api/elections/:id                      Delete
GET    /api/elections/creator/:creatorId       By creator
```

### Candidates (4)
```
POST   /api/candidates                         Add
GET    /api/candidates/election/:electionId    List
PUT    /api/candidates/:id                     Update
DELETE /api/candidates/:id                     Delete
```

### Votes (4)
```
POST   /api/votes                              Cast vote
GET    /api/votes/results/:electionId          Results
GET    /api/votes/check/:electionId/:voterId   Check voted
GET    /api/votes/election/:electionId         All votes
```

### Users (4)
```
POST   /api/users                              Create user
GET    /api/users/:id                          Get user
POST   /api/users/login                        Login
POST   /api/users/election/join                Join election
```

---

## 📊 Database (5 Tables)

```
users ──┬─→ elections ──┬─→ candidates ──┬─→ votes
        │               │                 │
        │               └─→ voters ───────┘
        └──────────────────────────────────→ votes
```

**Tables:**
- `users` (7 fields)
- `elections` (8 fields)
- `candidates` (9 fields)
- `votes` (5 fields)
- `voters` (6 fields)

---

## 🎯 Key Features

✅ Full CRUD operations
✅ Voting with duplicate prevention
✅ Real-time vote counting
✅ Election results
✅ User authentication
✅ CORS enabled
✅ Error handling
✅ Data integrity with foreign keys

---

## 🧪 Test the API

### Option 1: Using examples.js
```bash
node examples.js
```
This runs 10 example operations showing all features.

### Option 2: Using cURL
```bash
# Check API is running
curl http://localhost:5000/api/health

# Get all elections
curl http://localhost:5000/api/elections

# Create election
curl -X POST http://localhost:5000/api/elections \
  -H "Content-Type: application/json" \
  -d '{
    "title":"My Election",
    "description":"Test",
    "creatorId":"user1"
  }'
```

### Option 3: Using JavaScript (in browser console)
```javascript
// Already loaded via api.js

// Get all elections
const result = await getAllElections();
console.log(result);

// Create election
const result = await createElection(
  "Test Election",
  "Description",
  "2025-01-20",
  "2025-01-27"
);

// Cast a vote
const result = await castVote(electionId, candidateId);
```

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start server (production)
npm start

# Start with auto-reload (development)
npm run dev

# Check API health
curl http://localhost:5000/api/health

# View database
sqlite3 voting.db ".tables"

# Run examples
node examples.js
```

---

## 📱 Frontend Integration

The frontend (`FRONTEND.html`) is automatically connected via `api.js`

**How it works:**
1. FRONTEND.html loads api.js
2. api.js connects to backend on port 5000
3. All voting/election operations use the API
4. Data persists in SQLite database

**To use in your code:**
```javascript
// All functions available globally
registerUser(username, email, password)
loginUser(email, password)
createElection(title, description, startDate, endDate)
addCandidate(electionId, name, party, bio, image)
castVote(electionId, candidateId)
getElectionResults(electionId)
// ... and 14 more functions
```

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| Can't connect to API | Run `npm start` |
| Port already in use | Change port in server.js |
| Database locked | Delete `.db-wal` and `.db-shm` files |
| CORS errors | Check API_BASE_URL in api.js |
| No tables | Delete voting.db and restart |

---

## 📚 Documentation Files

```
README.md         → Complete API reference
SETUP.md          → Detailed setup instructions
DEPLOYMENT.md     → Full feature overview
examples.js       → Working code examples
api.js            → Frontend client (source)
```

---

## 🎓 Learning Path

1. **Read:** SETUP.md (5 min)
2. **Run:** npm install && npm start (2 min)
3. **Try:** Open http://localhost:5000 (1 min)
4. **Test:** node examples.js (2 min)
5. **Read:** README.md (10 min)
6. **Modify:** Edit code and test (30+ min)

---

## 💡 Pro Tips

- Use browser DevTools to inspect API calls
- Check server console for debug messages
- Run examples.js to see all operations
- Database auto-creates on first run
- Modify api.js to change API_BASE_URL if needed
- Use nodemon for automatic server reload during dev

---

## 📞 File References

| Need | See File |
|------|----------|
| API docs | README.md |
| Setup steps | SETUP.md |
| Features | DEPLOYMENT.md |
| Code examples | examples.js |
| Server config | server.js |
| Database schema | db.js |
| API client | api.js |
| Endpoints | routes/*.js |

---

## ✨ What's Included

- ✅ Complete REST API (18 endpoints)
- ✅ SQLite database (5 tables)
- ✅ Frontend client (300+ lines)
- ✅ Session management
- ✅ Error handling
- ✅ CORS support
- ✅ Full documentation
- ✅ Working examples
- ✅ Quick reference cards

---

**Status:** ✅ Ready to use!
**Setup Time:** ~5 minutes
**Tech Stack:** Node.js + Express + SQLite
**Default Port:** 5000

🗳️ **Happy Voting!**
