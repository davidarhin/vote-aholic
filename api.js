// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Current user session
let currentUser = null;
let currentElectionId = null;

// ==================== USER MANAGEMENT ====================

async function registerUser(username, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await response.json();
    if (response.ok) {
      currentUser = data;
      localStorage.setItem('currentUser', JSON.stringify(data));
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok) {
      currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function logoutUser() {
  currentUser = null;
  localStorage.removeItem('currentUser');
}

function loadUserSession() {
  const saved = localStorage.getItem('currentUser');
  if (saved) {
    currentUser = JSON.parse(saved);
  }
  return currentUser;
}

// ==================== ELECTION MANAGEMENT ====================

async function createElection(title, description, startDate, endDate) {
  if (!currentUser) {
    return { success: false, error: 'User not logged in' };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/elections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        creatorId: currentUser.id,
        startDate,
        endDate
      })
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getAllElections() {
  try {
    const response = await fetch(`${API_BASE_URL}/elections`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getElectionById(electionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/elections/${electionId}`);
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getCreatorElections() {
  if (!currentUser) {
    return { success: false, error: 'User not logged in' };
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/elections/creator/${currentUser.id}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateElection(electionId, title, description, status, startDate, endDate) {
  try {
    const response = await fetch(`${API_BASE_URL}/elections/${electionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, status, startDate, endDate })
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteElection(electionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/elections/${electionId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== CANDIDATE MANAGEMENT ====================

async function addCandidate(electionId, name, party, bio, image) {
  try {
    const response = await fetch(`${API_BASE_URL}/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        electionId,
        name,
        party,
        bio,
        image
      })
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getCandidatesByElection(electionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/candidates/election/${electionId}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function updateCandidate(candidateId, name, party, bio, image) {
  try {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, party, bio, image })
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function deleteCandidate(candidateId) {
  try {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
      method: 'DELETE'
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== VOTING ====================

async function castVote(electionId, candidateId) {
  if (!currentUser) {
    return { success: false, error: 'User not logged in' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        electionId,
        candidateId,
        voterId: currentUser.id
      })
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, error: data.error };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function checkIfVoted(electionId) {
  if (!currentUser) {
    return { success: false, error: 'User not logged in' };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/votes/check/${electionId}/${currentUser.id}`
    );
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getElectionResults(electionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/votes/results/${electionId}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function getElectionVotes(electionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/votes/election/${electionId}`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== UTILITY FUNCTIONS ====================

async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadUserSession();
  checkApiHealth().then(result => {
    if (result.success) {
      console.log('✓ API is connected and running');
    } else {
      console.warn('⚠ Could not connect to API. Make sure the backend server is running on port 5000');
    }
  });
});
