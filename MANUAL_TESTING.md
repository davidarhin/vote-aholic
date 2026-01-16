# Manual Testing Guide for VOTE-AHOLIC

This guide explains how to manually test the Voting System to ensure all requirements are met.

## 1. Setup & Starting
1.  Open a terminal in the project folder: `c:\Users\HP ELITE BOOK 840G3\Desktop\voters_project\vote-aholic`
2.  Install dependencies (if not done):
    ```bash
    npm install
    ```
3.  Start the server:
    ```bash
    node server.js
    ```
4.  You should see: `VOTE-AHOLIC API Server Started` on `http://localhost:3001`.

## 2. Admin Testing (No Login Required)
1.  Open your browser and navigate to: `http://localhost:3001/admin`
2.  **Verify Dashboard**: You should see "System Overview" with counters.
3.  **Create Election**:
    *   Click "**➕ Create Election**" tab.
    *   Fill in Title (e.g., "Class President"), Description, Start/End Dates.
    *   Click Next.
    *   Add at least 2 Candidates (Name & Party).
    *   Click Next -> **Launch Election**.
    *   Verify you are redirected to the "Elections" list and the new election is "**active**" (Status is set to active automatically).
4.  **Admin Tools**:
    *   Go to "**⚙️ Admin Tools**" tab.
    *   Click "**Reset Entire Database**" to wipe clean if needed (Warning: this deletes everything).

## 3. Voter Testing (User Flow)
1.  Open a **Incognito/Private** window (to act as a fresh user) and go to: `http://localhost:3001`
2.  **Registration**:
    *   Click "Login / Register" -> "Register" link.
    *   Enter Username, Email, Password.
    *   **Test Show Password**: Click the "Show Password" checkbox to verify visibility.
    *   Click "Create Account". You should be logged in automatically.
3.  **Voting**:
    *   On the Home tab, you should see the "Active Election" you created as Admin.
    *   Click "**Vote Now**".
    *   Select a Candidate.
    *   Click "**Vote Now**".
    *   Verify the status changes to "✓ Your vote... has been counted".
    *   **Verify Constraints**:
        *   Try to vote again (Buttons should be disabled/grayed out).
        *   Try to "Reset Vote" (Button is removed/disabled).
4.  **Results**:
    *   Click "**View Results**" tab.
    *   You should see the bar chart updating with your vote.

## 4. Live Updates Testing
1.  Keep the Admin Dashboard open in one window (showing Dashboard or Votes tab).
2.  Keep the Voter window open.
3.  Cast a vote as the Voter.
4.  Watch the Admin Dashboard. The "Votes Cast" count should increase (you may need to click Refresh or wait 10s for auto-refresh).

## 5. Security & Constraints Verification
*   **Duplicate Account**: Try to register again with the *same email* in a new incognito window. It should fail.
*   **Double Voting**: Log in as the same user in a different browser. Active election should show "Voted" and prevent second vote.

## 6. Database Verification
*   The system uses `voting.db` (SQLite). All data persists after server restart.
*   Restart server (`Ctrl+C` then `node server.js`).
*   Refresh pages. Your user, elections, and votes should still be there.
