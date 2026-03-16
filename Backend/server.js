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
    const { full_name, email, password, fitnessGoal } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ error: 'Minden mező kötelező!' });

    try {
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: 'Az email már foglalt!' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO users (full_name, email, password_hash, fitness_goal) VALUES (?, ?, ?, ?)', [full_name, email, hashedPassword, fitnessGoal || null]);
        res.status(201).json({ message: 'Sikeres regisztráció!', userId: result.insertId });
    } catch (error) {
        console.error('Hiba a regisztráció során:', error);
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
        const validPassword = await bcrypt.compare(password, user.password_hash); // bcrypt összehasonlítás
        if (!validPassword) return res.status(401).json({ error: 'Hibás adatok!' });

        res.status(200).json({
            success: true,
            user: { id: user.id, full_name: user.full_name, email: user.email }
        });
    } catch (error) {
        console.error('Hiba a bejelentkezés során:', error);
        res.status(500).json({ error: 'Szerverhiba!' });
    }
});

// KÉRDŐÍV MENTÉSE AZ ADATBÁZISBA
app.post('/api/questionnaire', async (req, res) => {
    const { userId, questionnaire: q } = req.body;

    if (!userId || !q) {
        return res.status(400).json({ error: 'Hiányzó adatok (userId vagy questionnaire)!' });
    }

    try {
        // Az SQL parancs megnézi, hogy van-e már mentett kérdőív ehhez a user-hez. Ha van, felülírja (UPDATE), ha nincs, létrehozza (INSERT)
        const query = `
            INSERT INTO user_questionnaires (
                user_id, gender, height_cm, weight_kg, birth_date, activity_level,
                experience_level, weekly_training_days, training_types,
                current_injury, chronic_conditions, medications,
                main_goal, goal_timeframe, specific_goal, motivations,
                sleep_hours, stress_level, sitting_time,
                diet_types, allergies, diet_control_level, wants_diet_recommendations,
                training_location, preferred_workout_duration_mins, preferred_weekly_frequency,
                physique_satisfaction, energy_level, obstacles, additional_comments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                gender=VALUES(gender), height_cm=VALUES(height_cm), weight_kg=VALUES(weight_kg), 
                birth_date=VALUES(birth_date), activity_level=VALUES(activity_level),
                experience_level=VALUES(experience_level), weekly_training_days=VALUES(weekly_training_days), 
                training_types=VALUES(training_types), current_injury=VALUES(current_injury), 
                chronic_conditions=VALUES(chronic_conditions), medications=VALUES(medications),
                main_goal=VALUES(main_goal), goal_timeframe=VALUES(goal_timeframe), 
                specific_goal=VALUES(specific_goal), motivations=VALUES(motivations),
                sleep_hours=VALUES(sleep_hours), stress_level=VALUES(stress_level), 
                sitting_time=VALUES(sitting_time), diet_types=VALUES(diet_types), 
                allergies=VALUES(allergies), diet_control_level=VALUES(diet_control_level), 
                wants_diet_recommendations=VALUES(wants_diet_recommendations),
                training_location=VALUES(training_location), preferred_workout_duration_mins=VALUES(preferred_workout_duration_mins), 
                preferred_weekly_frequency=VALUES(preferred_weekly_frequency), physique_satisfaction=VALUES(physique_satisfaction), 
                energy_level=VALUES(energy_level), obstacles=VALUES(obstacles), additional_comments=VALUES(additional_comments)
        `;

        const values = [
            userId, q.personalInfo.gender, q.personalInfo.height, q.personalInfo.weight, q.personalInfo.birthDate, q.personalInfo.activity,
            q.trainingExperience.frequency, q.trainingExperience.weeklyTraining, JSON.stringify(q.trainingExperience.trainingTypes || []),
            q.healthInfo.currentInjury || 'no', JSON.stringify(q.healthInfo.chronicConditions || []), q.healthInfo.medications,
            q.goals.mainGoal, q.goals.timeframe, q.goals.specificGoal, JSON.stringify(q.goals.motivation || []),
            q.lifestyle.sleepHours, q.lifestyle.stressLevel, q.lifestyle.sittingTime,
            JSON.stringify(q.nutrition.diet || []), q.nutrition.allergies, q.nutrition.dietControl, q.nutrition.dietRecommendations,
            q.preferences.trainingLocation, q.preferences.workoutTime, q.preferences.preferredFrequency,
            q.selfAssessment.satisfaction, q.selfAssessment.energy, JSON.stringify(q.selfAssessment.obstacles || []), q.selfAssessment.comments
        ];

        await pool.query(query, values);
        res.status(200).json({ success: true, message: 'Kérdőív adatai sikeresen mentve!' });
    } catch (error) {
        console.error('Hiba a kérdőív mentésekor:', error);
        res.status(500).json({ error: 'Szerverhiba a mentés során!' });
    }
});

// KÉRDŐÍV LEKÉRDEZÉSE (DASHBOARD SZÁMÁRA)
app.get('/api/questionnaire/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const [rows] = await pool.query('SELECT * FROM user_questionnaires WHERE user_id = ?', [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Nincs még kitöltött kérdőív.' });
        }
        
        const row = rows[0];
        
        // Visszaformázzuk az adatokat a Frontend (React state) számára értelmezhető JSON objektumba
        const formattedQuestionnaire = {
            personalInfo: {
                gender: row.gender, height: row.height_cm, weight: row.weight_kg, 
                birthDate: row.birth_date, activity: row.activity_level
            },
            trainingExperience: {
                frequency: row.experience_level, weeklyTraining: row.weekly_training_days, 
                trainingTypes: typeof row.training_types === 'string' ? JSON.parse(row.training_types) : row.training_types
            },
            healthInfo: {
                currentInjury: row.current_injury, 
                chronicConditions: typeof row.chronic_conditions === 'string' ? JSON.parse(row.chronic_conditions) : row.chronic_conditions, 
                medications: row.medications
            },
            goals: {
                mainGoal: row.main_goal, timeframe: row.goal_timeframe, specificGoal: row.specific_goal, 
                motivation: typeof row.motivations === 'string' ? JSON.parse(row.motivations) : row.motivations
            },
            lifestyle: { sleepHours: row.sleep_hours, stressLevel: row.stress_level, sittingTime: row.sitting_time },
            nutrition: {
                diet: typeof row.diet_types === 'string' ? JSON.parse(row.diet_types) : row.diet_types, 
                allergies: row.allergies, dietControl: row.diet_control_level, dietRecommendations: row.wants_diet_recommendations
            },
            preferences: { trainingLocation: row.training_location, workoutTime: row.preferred_workout_duration_mins, preferredFrequency: row.preferred_weekly_frequency },
            selfAssessment: {
                satisfaction: row.physique_satisfaction, energy: row.energy_level, 
                obstacles: typeof row.obstacles === 'string' ? JSON.parse(row.obstacles) : row.obstacles, comments: row.additional_comments
            }
        };

        res.status(200).json({ success: true, questionnaire: formattedQuestionnaire });
    } catch (error) {
        console.error('Hiba a kérdőív lekérdezésekor:', error);
        res.status(500).json({ error: 'Szerverhiba a lekérdezés során!' });
    }
});

const PORT = process.env.PORT || 5001;
// 0.0.0.0 szükséges a Docker eléréshez!
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Szerver fut a ${PORT}-es porton`);
});