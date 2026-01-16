const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.join(__dirname, 'voting.db');
const db = new sqlite3.Database(dbPath);

const SALT_ROUNDS = 10;

async function createAdmin() {
    const password = 'admin';
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const id = uuidv4();

    db.run(
        "INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (?, ?, ?, ?, 'admin')",
        [id, 'admin', 'admin@vote.com', hashedPassword],
        function (err) {
            if (err) {
                console.error(err.message);
            } else {
                console.log('Admin user created successfully');
                console.log('Username: admin');
                console.log('Password: admin');
            }
            db.close();
        }
    );
}

createAdmin();
