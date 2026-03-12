const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db', // Dockerben 'db' a host neve
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'powerplan',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Adatbázis teszt
pool.getConnection()
    .then((connection) => {
        console.log('✅ Sikeresen csatlakozva a MySQL adatbázishoz!');
        connection.release();
    })
    .catch((err) => console.error('❌ Hiba az adatbázis csatlakozáskor:', err.message));

// REGISZTRÁCIÓ
app.post('/api/register', async (req, res) => {
    const { nev, email, jelszo } = req.body;
    if (!nev || !email || !jelszo) return res.status(400).json({ error: 'Minden mező kötelező!' });

    try {
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: 'Az email már foglalt!' });

        const hashedPassword = await bcrypt.hash(jelszo, 10);
        const [result] = await pool.query('INSERT INTO users (nev, email, jelszo) VALUES (?, ?, ?)', [nev, email, hashedPassword]);
        res.status(201).json({ message: 'Sikeres regisztráció!', userId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: 'Szerverhiba történt!' });
    }
});

// BEJELENTKEZÉS (Javítva a 404 hiba miatt)
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Hibás adatok!' });

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.jelszo); // bcrypt összehasonlítás
        if (!validPassword) return res.status(401).json({ error: 'Hibás adatok!' });

        res.status(200).json({
            success: true,
            user: { id: user.id, nev: user.nev, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: 'Szerverhiba!' });
    }
});

const PORT = process.env.PORT || 5001;
// 0.0.0.0 szükséges a Docker eléréshez!
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Szerver fut a ${PORT}-es porton`);
});