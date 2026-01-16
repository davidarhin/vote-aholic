/**
 * VOTE-AHOLIC Enhanced Frontend Integration
 * This file provides database connectivity and admin dashboard functionality
 */

// ==================== APPLICATION STATE ====================
let appState = {
    currentStep: 1,
    elections: [],
    currentElectionId: null,
    hasVoted: false,
    currentVote: null,
    currentUser: null,
    adminMode: false,
    isLoading: false
};

// ==================== INITIALIZATION ====================

async function initializeApp() {
    console.log('🔄 Initializing VOTE-AHOLIC application...');
    
    // Load user session
    loadUserSession();
    
    // Check API connection
    const apiHealth = await checkApiHealth();
    if (apiHealth.success) {
        console.log('✓ API Connection Successful');
        showNotification('Connected to database', 'success');
        
        // Load elections from database
        await loadElectionsFromDatabase();
    } else {
        console.warn('⚠ API Connection Failed - Using local demo mode');
        showNotification('Using demo mode (API unavailable)', 'warning');
        // Use sample data as fallback
        initializeSampleElections();
    }
    
    updateUI();
}

async function loadElectionsFromDatabase() {
    try {
        const result = await getAllElections();
        if (result.success && result.data.length > 0) {
            appState.elections = result.data.map(election => ({
                id: election.id,
                title: election.title,
                description: election.description,
                creatorId: election.creatorId,
                startDate: election.startDate,
                endDate: election.endDate,
                status: election.status,
                candidates: election.candidates || [],
                allowVoteChange: false,
                requireVoterId: true,
                createdAt: election.createdAt
            }));
            
            if (appState.elections.length > 0) {
                appState.currentElectionId = appState.elections[0].id;
            }
        } else {
            // No elections in database, use sample
            initializeSampleElections();
        }
    } catch (error) {
        console.error('Error loading elections:', error);
        initializeSampleElections();
    }
}

function initializeSampleElections() {
    console.log('📊 Loading sample elections...');
    
    const sampleElection = {
        id: '1',
        title: "Student Council Election 2025",
        description: "Vote for your student council representatives",
        creatorId: 'admin-1',
        startDate: "2025-01-20",
        endDate: "2025-01-27",
        candidates: [
            { id: '1', name: "Alexandra Chen", party: "Progressive Alliance", bio: "Student representative", voteCount: 1452, electionId: '1' },
            { id: '2', name: "Marcus Johnson", party: "Unity Coalition", bio: "Class president", voteCount: 1285, electionId: '1' },
            { id: '3', name: "Sophia Rodriguez", party: "Green Future", bio: "Environmental advocate", voteCount: 987, electionId: '1' }
        ],
        allowVoteChange: false,
        requireVoterId: true,
        status: "active",
        createdAt: new Date().toISOString()
    };
    
    appState.elections.push(sampleElection);
    appState.currentElectionId = '1';
}

// ==================== LOGIN & USER MANAGEMENT ====================

async function loginUser() {
    const email = prompt('Enter email:');
    const password = prompt('Enter password:');
    
    if (!email || !password) return;
    
    const result = await loginUser(email, password);
    if (result.success) {
        appState.currentUser = result.data.user;
        showNotification('Logged in successfully!', 'success');
        updateUserUI();
    } else {
        showNotification(result.error || 'Login failed', 'error');
    }
}

function updateUserUI() {
    const userButton = document.getElementById('userStatusBtn');
    if (appState.currentUser) {
        userButton.innerHTML = `<i class="fas fa-user"></i> ${appState.currentUser.username} <span style="font-size: 12px;">[${appState.adminMode ? 'Admin' : 'Voter'}]</span>`;
        userButton.onclick = logoutUser;
    } else {
        userButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        userButton.onclick = loginUser;
    }
}

function logoutUser() {
    appState.currentUser = null;
    appState.adminMode = false;
    logoutUser();
    updateUserUI();
    updateUI();
    showNotification('Logged out', 'info');
}

// ==================== ADMIN DASHBOARD ====================

function toggleAdminMode() {
    if (!appState.currentUser) {
        showNotification('Please login first', 'warning');
        return;
    }
    
    appState.adminMode = !appState.adminMode;
    updateUI();
    
    if (appState.adminMode) {
        showNotification('Admin Mode Activated', 'success');
        switchTab('admin-dashboard');
    } else {
        showNotification('Admin Mode Deactivated', 'info');
    }
}

async function loadAdminDashboard() {
    if (!appState.adminMode) return;
    
    console.log('📊 Loading admin dashboard...');
    
    // Load all elections
    const electionsList = document.getElementById('adminElectionsList');
    electionsList.innerHTML = '<div class="loading">Loading elections...</div>';
    
    try {
        const result = await getAllElections();
        const elections = result.success ? result.data : appState.elections;
        
        electionsList.innerHTML = '';
        
        elections.forEach(election => {
            const totalVotes = (election.candidates || []).reduce((sum, c) => sum + (c.voteCount || 0), 0);
            const candidateCount = (election.candidates || []).length;
            
            const card = document.createElement('div');
            card.className = 'admin-election-card';
            card.innerHTML = `
                <div class="admin-card-header">
                    <h3>${election.title}</h3>
                    <span class="status-badge ${election.status}">${election.status}</span>
                </div>
                <div class="admin-card-stats">
                    <div class="stat"><strong>${candidateCount}</strong> Candidates</div>
                    <div class="stat"><strong>${totalVotes}</strong> Votes</div>
                    <div class="stat"><strong>${(election.candidates || []).length}</strong> Results</div>
                </div>
                <div class="admin-card-actions">
                    <button onclick="viewAdminElection('${election.id}')" class="btn-small btn-info">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button onclick="deleteElectionAdmin('${election.id}')" class="btn-small btn-danger">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            electionsList.appendChild(card);
        });
        
        // Update statistics
        const totalElections = elections.length;
        const activeElections = elections.filter(e => e.status === 'active').length;
        const totalVotes = elections.reduce((sum, e) => sum + ((e.candidates || []).reduce((s, c) => s + (c.voteCount || 0), 0)), 0);
        
        document.getElementById('adminTotalElections').textContent = totalElections;
        document.getElementById('adminActiveElections').textContent = activeElections;
        document.getElementById('adminTotalVotes').textContent = formatNumber(totalVotes);
        
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        electionsList.innerHTML = '<div class="error">Failed to load elections</div>';
    }
}

async function viewAdminElection(electionId) {
    const result = await getElectionById(electionId);
    if (!result.success) {
        showNotification('Failed to load election', 'error');
        return;
    }
    
    const election = result.data;
    appState.currentElectionId = electionId;
    
    // Show detailed election view
    const detailsDiv = document.getElementById('adminElectionDetails');
    if (!detailsDiv) return;
    
    const totalVotes = (election.candidates || []).reduce((sum, c) => sum + (c.voteCount || 0), 0);
    
    let candidatesHTML = (election.candidates || []).map(candidate => `
        <div class="candidate-row">
            <div class="candidate-info">
                <strong>${candidate.name}</strong>
                <small>${candidate.party || 'Independent'}</small>
            </div>
            <div class="candidate-votes">
                <strong>${candidate.voteCount || 0}</strong> votes
                <div class="vote-percent">${totalVotes > 0 ? Math.round((candidate.voteCount / totalVotes) * 100) : 0}%</div>
            </div>
        </div>
    `).join('');
    
    detailsDiv.innerHTML = `
        <div class="admin-details">
            <h3>${election.title}</h3>
            <p>${election.description}</p>
            <div class="details-row">
                <div><strong>Status:</strong> ${election.status}</div>
                <div><strong>Total Votes:</strong> ${totalVotes}</div>
                <div><strong>Candidates:</strong> ${(election.candidates || []).length}</div>
            </div>
            <div class="details-row">
                <div><strong>Start Date:</strong> ${election.startDate}</div>
                <div><strong>End Date:</strong> ${election.endDate}</div>
            </div>
            <h4>Candidates & Results</h4>
            ${candidatesHTML}
        </div>
    `;
}

async function deleteElectionAdmin(electionId) {
    if (!confirm('Are you sure you want to delete this election?')) return;
    
    const result = await deleteElection(electionId);
    if (result.success) {
        showNotification('Election deleted successfully', 'success');
        loadAdminDashboard();
    } else {
        showNotification('Failed to delete election', 'error');
    }
}

// ==================== ELECTION CREATION ====================

async function launchElection() {
    const title = document.getElementById('electionTitle').value;
    const description = document.getElementById('electionDescription').value;
    const startDate = document.getElementById('voteStartDate').value;
    const endDate = document.getElementById('voteEndDate').value;
    
    // Get candidates
    const candidates = [];
    document.querySelectorAll('.candidate-fields').forEach((field, index) => {
        const name = field.querySelector('.candidate-name').value;
        const party = field.querySelector('.candidate-party').value;
        const bio = field.querySelector('.candidate-bio').value;
        
        if (name.trim()) {
            candidates.push({ name, party, bio, image: '' });
        }
    });
    
    // Validation
    if (!title || !description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (candidates.length < 2) {
        showNotification('Please add at least 2 candidates', 'error');
        return;
    }
    
    if (!appState.currentUser) {
        showNotification('Please login first', 'warning');
        return;
    }
    
    // Create election
    const result = await createElection(title, description, startDate, endDate);
    if (!result.success) {
        showNotification('Failed to create election: ' + result.error, 'error');
        return;
    }
    
    const electionId = result.data.id;
    
    // Add candidates
    for (const candidate of candidates) {
        const candidateResult = await addCandidate(electionId, candidate.name, candidate.party, candidate.bio, candidate.image);
        if (!candidateResult.success) {
            showNotification('Failed to add candidate: ' + candidate.name, 'error');
            return;
        }
    }
    
    showNotification(`Election "${title}" created successfully!`, 'success');
    
    // Reset form
    resetElectionForm();
    
    // Reload elections
    await loadElectionsFromDatabase();
    updateUI();
    switchTab('my-elections');
}

function resetElectionForm() {
    document.getElementById('electionTitle').value = '';
    document.getElementById('electionDescription').value = '';
    document.getElementById('voteInstructions').value = '';
    nextStep(1);
}

// ==================== VOTING ====================

async function castVoteHandler(candidateId) {
    if (!appState.currentUser) {
        showNotification('Please login first', 'warning');
        return;
    }
    
    if (appState.hasVoted) {
        showNotification('You have already voted in this election', 'warning');
        return;
    }
    
    if (!confirm('Are you sure you want to cast this vote?')) return;
    
    const result = await castVote(appState.currentElectionId, candidateId);
    if (result.success) {
        appState.hasVoted = true;
        appState.currentVote = candidateId;
        showNotification('Vote cast successfully!', 'success');
        loadVotingInterface();
    } else {
        showNotification(result.error || 'Failed to cast vote', 'error');
    }
}

// ==================== VOTING INTERFACE ====================

async function loadVotingInterface() {
    const election = appState.elections.find(e => e.id === appState.currentElectionId);
    if (!election) return;
    
    // Update header
    document.getElementById('currentElectionTitle').textContent = election.title;
    document.getElementById('currentElectionDescription').textContent = election.description;
    
    // Load candidates
    const grid = document.getElementById('votingCandidatesGrid');
    grid.innerHTML = '';
    
    const candidates = election.candidates || [];
    candidates.forEach(candidate => {
        const card = document.createElement('div');
        card.className = 'candidate-card';
        card.innerHTML = `
            <div class="candidate-image"><i class="fas fa-user-tie"></i></div>
            <div class="candidate-info">
                <h3 class="candidate-name">${candidate.name}</h3>
                <span class="candidate-party">${candidate.party || 'Independent'}</span>
                <p class="candidate-bio">${candidate.bio || 'No bio provided'}</p>
                <div class="vote-section">
                    <div class="vote-count">Votes: <strong>${candidate.voteCount || 0}</strong></div>
                    <button class="vote-btn" onclick="castVoteHandler('${candidate.id}')">Vote</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    
    updateVotingStatus();
}

function updateVotingStatus() {
    const statusText = document.getElementById('voteStatusText');
    if (appState.hasVoted) {
        statusText.textContent = '✓ You have voted successfully!';
        statusText.style.color = 'green';
    } else {
        statusText.textContent = 'Please select a candidate to vote';
        statusText.style.color = '#666';
    }
}

// ==================== RESULTS ====================

async function loadResults() {
    const election = appState.elections.find(e => e.id === appState.currentElectionId);
    if (!election) return;
    
    document.getElementById('resultsElectionTitle').textContent = election.title;
    
    const candidates = election.candidates || [];
    const totalVotes = candidates.reduce((sum, c) => sum + (c.voteCount || 0), 0);
    
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';
    
    candidates.forEach(candidate => {
        const percent = totalVotes > 0 ? Math.round(((candidate.voteCount || 0) / totalVotes) * 100) : 0;
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <div class="result-header">
                <div><strong>${candidate.name}</strong> (${candidate.party})</div>
                <div><strong>${percent}%</strong></div>
            </div>
            <div class="vote-bar-container">
                <div class="vote-bar" style="width: ${percent}%;"></div>
            </div>
            <div style="text-align: right; color: #666; font-size: 12px;">${candidate.voteCount || 0} votes</div>
        `;
        container.appendChild(item);
    });
    
    const totalDiv = document.createElement('div');
    totalDiv.innerHTML = `<h3>Total Votes: ${formatNumber(totalVotes)}</h3>`;
    container.appendChild(totalDiv);
}

// ==================== ELECTIONS LIST ====================

async function loadMyElections() {
    const grid = document.getElementById('myElectionsGrid');
    grid.innerHTML = '<div class="loading">Loading elections...</div>';
    
    try {
        const result = await getCreatorElections();
        const elections = result.success ? result.data : appState.elections;
        
        grid.innerHTML = '';
        elections.forEach(election => {
            const totalVotes = (election.candidates || []).reduce((sum, c) => sum + (c.voteCount || 0), 0);
            const card = document.createElement('div');
            card.className = 'election-card';
            card.innerHTML = `
                <div class="election-card-header">
                    <h4>${election.title}</h4>
                    <span class="status-badge ${election.status}">${election.status}</span>
                </div>
                <p>${election.description}</p>
                <div class="election-stats">
                    <span><i class="fas fa-user"></i> ${(election.candidates || []).length} Candidates</span>
                    <span><i class="fas fa-vote-yea"></i> ${totalVotes} Votes</span>
                </div>
                <div class="election-actions">
                    <button onclick="viewElection('${election.id}')" class="btn-small">View</button>
                    <button onclick="viewElectionResults('${election.id}')" class="btn-small">Results</button>
                </div>
            `;
            grid.appendChild(card);
        });
        
        document.getElementById('myElectionsCount').textContent = elections.length;
    } catch (error) {
        grid.innerHTML = '<div class="error">Failed to load elections</div>';
    }
}

function viewElection(electionId) {
    appState.currentElectionId = electionId;
    switchTab('vote');
}

function viewElectionResults(electionId) {
    appState.currentElectionId = electionId;
    switchTab('results');
}

// ==================== TAB NAVIGATION ====================

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from buttons
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    const tabElement = document.getElementById(tabName);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Activate tab button
    document.querySelectorAll('.tab').forEach(tab => {
        if (tab.getAttribute('onclick')?.includes(tabName)) {
            tab.classList.add('active');
        }
    });
    
    // Load content
    if (tabName === 'my-elections') {
        loadMyElections();
    } else if (tabName === 'vote') {
        loadVotingInterface();
    } else if (tabName === 'results') {
        loadResults();
    } else if (tabName === 'admin-dashboard') {
        loadAdminDashboard();
    }
}

// ==================== SETUP WIZARD ====================

function nextStep(step) {
    document.querySelectorAll('.step').forEach(s => {
        s.classList.remove('active');
    });
    document.getElementById(`step${step}`).classList.add('active');
    
    for (let i = 1; i < step; i++) {
        document.getElementById(`step${i}`).classList.add('completed');
    }
    
    document.querySelectorAll('.form-step').forEach(s => {
        s.style.display = 'none';
    });
    const formStep = document.getElementById(`formStep${step}`);
    if (formStep) {
        formStep.style.display = 'block';
    }
    
    appState.currentStep = step;
}

function addCandidateField() {
    const container = document.getElementById('candidatesContainer');
    const count = container.children.length + 1;
    
    const field = document.createElement('div');
    field.className = 'candidate-fields';
    field.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label class="form-label">Candidate Name *</label>
                <input type="text" class="form-input candidate-name" placeholder="Name">
            </div>
            <div class="form-group">
                <label class="form-label">Party/Affiliation</label>
                <input type="text" class="form-input candidate-party" placeholder="Party">
            </div>
        </div>
        <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea class="form-textarea candidate-bio" placeholder="Biography"></textarea>
        </div>
        <button type="button" class="remove-candidate-btn" onclick="removeCandidate(this)">
            <i class="fas fa-times"></i> Remove
        </button>
    `;
    container.appendChild(field);
}

function removeCandidate(btn) {
    const count = document.querySelectorAll('.candidate-fields').length;
    if (count > 1) {
        btn.closest('.candidate-fields').remove();
    } else {
        showNotification('You need at least one candidate', 'warning');
    }
}

// ==================== UTILITIES ====================

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function updateUI() {
    updateDashboardStats();
    updateUserUI();
}

function updateDashboardStats() {
    const activeElections = appState.elections.filter(e => e.status === 'active').length;
    const totalVotes = appState.elections.reduce((sum, e) => sum + ((e.candidates || []).reduce((s, c) => s + (c.voteCount || 0), 0)), 0);
    
    const activeEl = document.getElementById('activeElectionsCount');
    const myEl = document.getElementById('myElectionsCount');
    
    if (activeEl) activeEl.textContent = activeElections;
    if (myEl) myEl.textContent = appState.elections.length;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }, 100);
}

// ==================== PAGE LOAD ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing VOTE-AHOLIC...');
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const startDateEl = document.getElementById('voteStartDate');
    const endDateEl = document.getElementById('voteEndDate');
    
    if (startDateEl) startDateEl.value = today;
    if (endDateEl) endDateEl.value = nextWeek;
    
    // Initialize app
    initializeApp();
});
