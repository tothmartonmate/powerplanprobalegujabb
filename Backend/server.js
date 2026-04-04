const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'powerplan',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then((connection) => { console.log('✅ Sikeresen csatlakozva a MySQL adatbázishoz!'); connection.release(); })
    .catch((err) => console.error('❌ Hiba az adatbázis csatlakozáskor:', err.message));

let progressImageColumnPromise;
const parseJsonArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const getProgressImageColumn = async () => {
    if (!progressImageColumnPromise) {
        progressImageColumnPromise = (async () => {
            const [imageBase64Column] = await pool.query("SHOW COLUMNS FROM progress_photos LIKE 'image_base64'");
            return imageBase64Column.length > 0 ? 'image_base64' : 'image_data';
        })();
    }
    return progressImageColumnPromise;
};

// -------------------- REGISZTRÁCIÓ --------------------
app.get('/api/register/check-email', async (req, res) => {
    const email = String(req.query.email || '').trim();
    if (!email) return res.status(400).json({ error: 'Email szükséges!' });

    try {
        const [existing] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
        return res.status(200).json({ exists: existing.length > 0 });
    } catch (error) {
        console.error('Email ellenőrzési hiba:', error);
        return res.status(500).json({ error: 'Szerverhiba történt!' });
    }
});

app.post('/api/register', async (req, res) => {
    const { full_name, email, password, fitnessGoal } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ error: 'Minden mező kötelező!' });
    try {
        const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(409).json({ error: 'Az email már foglalt!' });
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query('INSERT INTO users (full_name, email, password_hash, fitness_goal) VALUES (?, ?, ?, ?)', [full_name, email, hashedPassword, fitnessGoal || null]);
        res.status(201).json({ message: 'Sikeres regisztráció!', userId: result.insertId });
    } catch (error) { res.status(500).json({ error: 'Szerverhiba történt!' }); }
});

// -------------------- BEJELENTKEZÉS --------------------
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await pool.query('SELECT id, full_name, email, password_hash, profile_image FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Hibás adatok!' });
        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Hibás adatok!' });
        const token = Buffer.from(`${user.id}-${Date.now()}`).toString('base64');
        res.status(200).json({ 
            success: true, 
            user: { id: user.id, full_name: user.full_name, email: user.email, profile_image: user.profile_image },
            token: token
        });
    } catch (error) { 
        console.error(error);
        res.status(500).json({ error: 'Szerverhiba!' }); 
    }
});

// -------------------- KÉRDŐÍV MENTÉSE (POST) --------------------
app.post('/api/questionnaire', async (req, res) => {
    const { userId, questionnaire: q } = req.body;
    if (!userId || !q) return res.status(400).json({ error: 'Hiányzó adatok!' });
    try {
        const query = `
            INSERT INTO user_questionnaires (
                user_id, gender, height_cm, weight_kg, birth_date, activity_level, experience_level, weekly_training_days, training_types,
                current_injury, chronic_conditions, medications, main_goal, goal_timeframe, specific_goal, motivations,
                sleep_hours, stress_level, sitting_time, diet_types, allergies, diet_control_level, wants_diet_recommendations,
                training_location, preferred_workout_duration_mins, preferred_weekly_frequency, physique_satisfaction, energy_level, obstacles, additional_comments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                gender=VALUES(gender), height_cm=VALUES(height_cm), weight_kg=VALUES(weight_kg), 
                birth_date=VALUES(birth_date), main_goal=VALUES(main_goal), allergies=VALUES(allergies),
                activity_level=VALUES(activity_level), experience_level=VALUES(experience_level),
                weekly_training_days=VALUES(weekly_training_days)
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

        // Súlynapló - a questionnaire kitöltéskor rögzítjük az inicial súlyt
        const rawWeight = q.personalInfo.weight;
        const weightValue = rawWeight !== undefined && rawWeight !== null ? parseFloat(String(rawWeight).replace(',', '.')) : NaN;
        if (!Number.isNaN(weightValue)) {
            const [existingLogs] = await pool.query(
                'SELECT COUNT(*) as cnt FROM weight_logs WHERE user_id = ?',
                [userId]
            );
            if (existingLogs[0].cnt === 0) {
                // Első súlynapló - az adott dátummal rögzítjük
                await pool.query(
                    'INSERT INTO weight_logs (user_id, weight_kg, logged_at) VALUES (?, ?, CURDATE())',
                    [userId, weightValue]
                );
            }
        }

        res.status(200).json({ success: true });
    } catch (error) { console.error(error); res.status(500).json({ error: 'Szerverhiba!' }); }
});

// -------------------- KÉRDŐÍV LEKÉRÉSE --------------------
app.get('/api/questionnaire/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT q.*, u.full_name, u.email
             FROM user_questionnaires q
             LEFT JOIN users u ON u.id = q.user_id
             WHERE q.user_id = ?`,
            [req.params.userId]
        );
        if (rows.length === 0) return res.status(404).json({ message: 'Nincs kérdőív.' });
        const row = rows[0];
        const nameParts = String(row.full_name || '').trim().split(/\s+/).filter(Boolean);
        const firstName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        const lastName = nameParts[0] || '';

        res.status(200).json({
            success: true,
            questionnaire: {
                email: row.email || '',
                personalInfo: {
                    firstName,
                    lastName,
                    gender: row.gender || '',
                    height: row.height_cm || '',
                    weight: row.weight_kg || '',
                    birthDate: row.birth_date || '',
                    activity: row.activity_level || ''
                },
                trainingExperience: {
                    frequency: row.experience_level || '',
                    weeklyTraining: row.weekly_training_days || '',
                    trainingTypes: parseJsonArray(row.training_types)
                },
                healthInfo: {
                    currentInjury: row.current_injury || '',
                    chronicConditions: parseJsonArray(row.chronic_conditions),
                    medications: row.medications || ''
                },
                goals: {
                    mainGoal: row.main_goal || '',
                    timeframe: row.goal_timeframe || '',
                    specificGoal: row.specific_goal || '',
                    motivation: parseJsonArray(row.motivations)
                },
                lifestyle: {
                    sleepHours: row.sleep_hours || '',
                    stressLevel: row.stress_level || '',
                    sittingTime: row.sitting_time || ''
                },
                nutrition: {
                    diet: parseJsonArray(row.diet_types),
                    allergies: row.allergies || '',
                    dietControl: row.diet_control_level || '',
                    dietRecommendations: row.wants_diet_recommendations || ''
                },
                preferences: {
                    trainingLocation: row.training_location || '',
                    workoutTime: row.preferred_workout_duration_mins || '',
                    preferredFrequency: row.preferred_weekly_frequency || ''
                },
                selfAssessment: {
                    satisfaction: row.physique_satisfaction || '',
                    energy: row.energy_level || '',
                    obstacles: parseJsonArray(row.obstacles),
                    comments: row.additional_comments || ''
                }
            }
        });
    } catch (error) { res.status(500).json({ error: 'Szerverhiba!' }); }
});

const getWeekRangeFromDate = (dateInput) => {
    const baseDate = dateInput ? new Date(dateInput) : new Date();
    const normalizedDate = Number.isNaN(baseDate.getTime()) ? new Date() : baseDate;
    const startOfWeek = new Date(normalizedDate);
    const dayOfWeek = startOfWeek.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const toDateString = (date) => {
        const year = date.getFullYear();
        const month = `${date.getMonth() + 1}`.padStart(2, '0');
        const day = `${date.getDate()}`.padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        startOfWeek,
        endOfWeek,
        startDate: toDateString(startOfWeek),
        endDate: toDateString(endOfWeek)
    };
};

// -------------------- DASHBOARD --------------------
app.get('/api/dashboard/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const [meals] = await pool.query(`SELECT id, meal_type, food_name as name, description, calories, protein_g as protein, carbs_g as carbs, fat_g as fat, DATE_FORMAT(consumed_date, '%H:%i') as time FROM nutrition_logs WHERE user_id = ? AND consumed_date = CURDATE() ORDER BY created_at DESC`, [userId]);
        const [workoutRows] = await pool.query(
            `SELECT w.id as workout_id, w.name as workout_name, w.workout_type, w.scheduled_day, w.created_at as workout_created_at, e.id as ex_id, e.muscle_group, e.exercise_name, e.sets_data 
             FROM workouts w 
             LEFT JOIN workout_exercises e ON w.id = e.workout_id 
             WHERE w.user_id = ?`, 
            [userId]
        );
        const groupedWorkouts = {};
        workoutRows.forEach(row => {
            if (!groupedWorkouts[row.workout_id]) {
                groupedWorkouts[row.workout_id] = {
                    id: row.workout_id, name: row.workout_name, type: row.workout_type, day: row.scheduled_day, created_at: row.workout_created_at, exercises: []
                };
            }
            if (row.ex_id) {
                groupedWorkouts[row.workout_id].exercises.push({
                    muscle: row.muscle_group, name: row.exercise_name, sets: typeof row.sets_data === 'string' ? JSON.parse(row.sets_data) : row.sets_data
                });
            }
        });
        const [userStats] = await pool.query(`SELECT total_points, current_level FROM users WHERE id = ?`, [userId]);
        const [qRows] = await pool.query('SELECT main_goal, allergies FROM user_questionnaires WHERE user_id = ?', [userId]);
        let recommendedMeals = [];
        let recommendedWorkoutText = 'Töltsd ki a kérdőívet a személyre szabott ajánlásokért!';
        if (qRows.length > 0) {
            const goal = qRows[0].main_goal;
            const allergies = qRows[0].allergies ? qRows[0].allergies.toLowerCase() : '';
            if (goal === 'weightLoss') {
                recommendedMeals.push({ name: 'Zabkása bogyós gyümölcsökkel', cals: 300, desc: 'Kiváló zsírégető reggeli.' }, { name: 'Grillezett csirkemell friss salátával', cals: 350, desc: 'Fehérjedús ebéd.' });
                recommendedWorkoutText = 'Heti 3x Kardió (45 perc), plusz 2x könnyű súlyzós edzés.';
            } else if (goal === 'muscleGain') {
                recommendedMeals.push({ name: 'Tojásrántotta (4 tojás)', cals: 550, desc: 'Izomépítő reggeli.' }, { name: 'Marhasteak édesburgonyával', cals: 700, desc: 'Lassan felszívódó szénhidrát.' });
                recommendedWorkoutText = 'Heti 4x Nehéz súlyzós edzés (alsó/felsőtest bontásban).';
            } else {
                recommendedMeals.push({ name: 'Görög joghurt müzlivel', cals: 350, desc: 'Kiegyensúlyozott reggeli.' });
                recommendedWorkoutText = 'Heti 3x Teljes testes átmozgató edzés.';
            }
            if (allergies.includes('laktóz') || allergies.includes('tej')) {
                recommendedMeals.push({ name: '🌟 Laktózmentes Turmix', cals: 200, desc: 'Laktózérzékenyeknek!' });
            }
        }
        const [weightRows] = await pool.query(
            'SELECT weight_kg as weight, logged_at as date FROM weight_logs WHERE user_id = ? ORDER BY logged_at ASC, created_at ASC',
            [userId]
        );

        res.json({
            success: true,
            nutrition: { todayMeals: meals, dailyCalories: meals.reduce((sum, meal) => sum + meal.calories, 0), macros: { protein: 0, carbs: 0, fat: 0 }, recommendations: recommendedMeals },
            workout: { weeklyPlan: Object.values(groupedWorkouts), stats: { totalWorkouts: Object.keys(groupedWorkouts).length, completedWorkouts: 0 }, aiRecommendation: recommendedWorkoutText },
            challenges: { level: userStats[0]?.current_level || 1, points: userStats[0]?.total_points || 0 },
            weightHistory: weightRows
        });
    } catch (error) { console.error(error); res.status(500).json({ success: false }); }
});

app.get('/api/nutrition/:userId/week', async (req, res) => {
    const { userId } = req.params;
    const { date } = req.query;

    if (!userId) {
        return res.status(400).json({ error: 'Hiányzó felhasználó azonosító!' });
    }

    try {
        const { startDate, endDate, startOfWeek } = getWeekRangeFromDate(date);
        const [rows] = await pool.query(
            `SELECT id, meal_type, food_name as name, description, calories, protein_g as protein, carbs_g as carbs, fat_g as fat, DATE_FORMAT(consumed_date, '%Y-%m-%d') as consumedDate, DATE_FORMAT(created_at, '%H:%i') as time
             FROM nutrition_logs
             WHERE user_id = ? AND consumed_date BETWEEN ? AND ?
             ORDER BY consumed_date DESC, created_at DESC`,
            [userId, startDate, endDate]
        );

        const totalsByDate = rows.reduce((accumulator, meal) => {
            accumulator[meal.consumedDate] = (accumulator[meal.consumedDate] || 0) + (Number(meal.calories) || 0);
            return accumulator;
        }, {});

        const dailyTotals = Array.from({ length: 7 }, (_, index) => {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + index);
            const year = day.getFullYear();
            const month = `${day.getMonth() + 1}`.padStart(2, '0');
            const dayOfMonth = `${day.getDate()}`.padStart(2, '0');
            const currentDate = `${year}-${month}-${dayOfMonth}`;

            return {
                date: currentDate,
                totalCalories: totalsByDate[currentDate] || 0
            };
        });

        return res.json({
            success: true,
            meals: rows,
            dailyTotals,
            weekStart: startDate,
            weekEnd: endDate
        });
    } catch (error) {
        console.error('Hiba heti táplálkozás lekérésekor:', error);
        return res.status(500).json({ error: 'Szerverhiba!' });
    }
});

// -------------------- ÉTKEZÉS NAPLÓZÁSA --------------------
app.post('/api/meals', async (req, res) => {
    const { userId, mealType, foodName, description, calories, consumedDate } = req.body;
    if (!userId || !mealType || !foodName || !calories) return res.status(400).json({ error: 'Hiányzó adatok!' });
    try {
        const mealDate = consumedDate || new Date().toISOString().split('T')[0];
        await pool.query(`INSERT INTO nutrition_logs (user_id, meal_type, food_name, description, calories, consumed_date) VALUES (?, ?, ?, ?, ?, ?)`, [userId, mealType, foodName, description, calories, mealDate]);
        res.status(201).json({ success: true });
    } catch (error) { res.status(500).json({ error: 'Szerverhiba!' }); }
});

// -------------------- ÉTKEZÉS TÖRLÉSE --------------------
app.delete('/api/meals/:mealId', async (req, res) => {
    const { mealId } = req.params;
    if (!mealId) return res.status(400).json({ error: 'Hiányzó azonosító!' });
    try {
        await pool.query('DELETE FROM nutrition_logs WHERE id = ?', [mealId]);
        res.json({ success: true, message: 'Étkezés törölve!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Szerverhiba!' });
    }
});

// -------------------- FEJLŐDÉS FOTÓK (Progress photos) --------------------
app.get('/api/progress/:userId', async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: 'Hiányzó felhasználó azonosító!' });
    try {
        const imageColumn = await getProgressImageColumn();
        const [rows] = await pool.query(`SELECT id, user_id as userId, ${imageColumn} as imageBase64, note, record_date as recordDate, created_at as createdAt, updated_at as updatedAt FROM progress_photos WHERE user_id = ? ORDER BY record_date DESC, created_at DESC`, [userId]);
        return res.status(200).json({ success: true, progress: rows });
    } catch (error) {
        console.error('Hiba progress lekérésekor:', error);
        return res.status(500).json({ error: 'Szerverhiba!' });
    }
});

app.post('/api/progress', async (req, res) => {
    const { userId, imageBase64, note, recordDate } = req.body;
    if (!userId || !imageBase64 || !recordDate) {
        return res.status(400).json({ error: 'userId, imageBase64 és recordDate szükséges!' });
    }
    try {
        const imageColumn = await getProgressImageColumn();
        const [result] = await pool.query(
            `INSERT INTO progress_photos (user_id, ${imageColumn}, note, record_date) VALUES (?, ?, ?, ?)`,
            [userId, imageBase64, note || null, recordDate]
        );
        res.status(201).json({ success: true, id: result.insertId });
    } catch (error) {
        console.error('Hiba progress mentésekor:', error);
        res.status(500).json({ error: 'Szerverhiba!' });
    }
});

app.put('/api/progress/:id', async (req, res) => {
    const { id } = req.params;
    const { note, recordDate } = req.body;
    if (!id) return res.status(400).json({ error: 'Hiányzó azonosító!' });
    try {
        await pool.query(
            'UPDATE progress_photos SET note = COALESCE(?, note), record_date = COALESCE(?, record_date), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [note || null, recordDate || null, id]
        );
        res.json({ success: true, message: 'Progresszió frissítve!' });
    } catch (error) {
        console.error('Hiba progress frissítésekor:', error);
        res.status(500).json({ error: 'Szerverhiba!' });
    }
});

app.delete('/api/progress/:id', async (req, res) => {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Hiányzó azonosító!' });
    try {
        await pool.query('DELETE FROM progress_photos WHERE id = ?', [id]);
        res.json({ success: true, message: 'Progresszió kép törölve!' });
    } catch (error) {
        console.error('Hiba progress törlésekor:', error);
        res.status(500).json({ error: 'Szerverhiba!' });
    }
});

// -------------------- PROFIL FRISSÍTÉSE (név, email, magasság, súly, születési dátum) --------------------
app.put('/api/update-profile', async (req, res) => {
    const { userId, fullName, email, height, weight, birthDate } = req.body;
    if (!userId) return res.status(400).json({ error: 'Hiányzó felhasználó azonosító!' });
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [existingRows] = await connection.query('SELECT weight_kg FROM user_questionnaires WHERE user_id = ?', [userId]);
        const previousWeight = existingRows.length ? parseFloat(String(existingRows[0].weight_kg).replace(',', '.')) : null;
        
        const newWeight = weight !== undefined && weight !== null ? parseFloat(String(weight).replace(',', '.')) : NaN;
        
        // Ha az előző súly eltér az újból, és az előző még nincs rögzítve, rögzítjük azt egy nappal korábbra
        if (previousWeight !== null && !Number.isNaN(previousWeight) && previousWeight !== newWeight) {
            const [lastLog] = await connection.query(
                'SELECT weight_kg FROM weight_logs WHERE user_id = ? AND weight_kg = ? LIMIT 1',
                [userId, previousWeight]
            );
            if (lastLog.length === 0) {
                const previousDate = new Date();
                previousDate.setDate(previousDate.getDate() - 1);
                const formattedPreviousDate = previousDate.toISOString().split('T')[0];
                await connection.query(
                    'INSERT INTO weight_logs (user_id, weight_kg, logged_at) VALUES (?, ?, ?)',
                    [userId, previousWeight, formattedPreviousDate]
                );
            }
        }
        
        // Az új súly rögzítése mai napra
        if (!Number.isNaN(newWeight) && previousWeight !== newWeight) {
            await connection.query(
                'INSERT INTO weight_logs (user_id, weight_kg, logged_at) VALUES (?, ?, CURDATE())',
                [userId, newWeight]
            );
        }

        // Frissítjük a users táblában a nevet és emailt
        await connection.query('UPDATE users SET full_name = ?, email = ? WHERE id = ?', [fullName, email, userId]);
        // Frissítjük a kérdőív táblában a magasságot, súlyt, születési dátumot
        await connection.query(
            `UPDATE user_questionnaires SET height_cm = ?, weight_kg = ?, birth_date = ? WHERE user_id = ?`,
            [height, weight, birthDate, userId]
        );
        await connection.commit();
        res.json({ success: true, message: 'Profil frissítve!' });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: 'Szerverhiba!' });
    } finally {
        connection.release();
    }
});

// -------------------- EDZÉS MENTÉSE --------------------
app.post('/api/workouts', async (req, res) => {
    const { userId, name, workoutType, scheduledDay, exercises } = req.body;
    if (!userId || !name || !workoutType || !scheduledDay || !exercises || exercises.length === 0) {
        return res.status(400).json({ error: 'Minden adat és legalább egy gyakorlat megadása kötelező!' });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [wResult] = await connection.query(
            'INSERT INTO workouts (user_id, name, workout_type, scheduled_day) VALUES (?, ?, ?, ?)',
            [userId, name, workoutType, scheduledDay]
        );
        const workoutId = wResult.insertId;
        for (let ex of exercises) {
            await connection.query(
                'INSERT INTO workout_exercises (workout_id, muscle_group, exercise_name, sets_data) VALUES (?, ?, ?, ?)',
                [workoutId, ex.muscleGroup, ex.name, JSON.stringify(ex.sets)]
            );
        }
        await connection.commit();
        res.status(201).json({ success: true, message: 'Teljes edzésterv elmentve!' });
    } catch (error) {
        await connection.rollback();
        console.error('Hiba az edzés mentésekor:', error);
        res.status(500).json({ error: 'Szerverhiba!' });
    } finally {
        connection.release();
    }
});

// -------------------- HETI EDZÉSEK LEKÉRÉSE --------------------
app.get('/api/workouts/:userId/week', async (req, res) => {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Start date and end date required' });
    }
    try {
        const [columns] = await pool.query(`SHOW COLUMNS FROM workouts LIKE 'created_at'`);
        if (columns.length === 0) {
            await pool.query(`ALTER TABLE workouts ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP`);
            console.log('✅ Hozzáadva a created_at oszlop a workouts táblához');
        }
        const [workouts] = await pool.query(
            `SELECT w.*, 
                COALESCE(
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id', we.id,
                            'muscleGroup', we.muscle_group,
                            'name', we.exercise_name,
                            'sets', we.sets_data,
                            'sortOrder', we.sort_order
                        )
                    ), '[]'
                ) as exercises
             FROM workouts w
             LEFT JOIN workout_exercises we ON w.id = we.workout_id
             WHERE w.user_id = ? 
               AND DATE(w.created_at) BETWEEN ? AND ?
             GROUP BY w.id
             ORDER BY w.scheduled_day, w.created_at`,
            [userId, startDate, endDate]
        );
        const parsedWorkouts = workouts.map(w => ({
            ...w,
            exercises: w.exercises && w.exercises !== '[]' ? JSON.parse(w.exercises).map(ex => ({
                ...ex,
                sets: typeof ex.sets === 'string' ? JSON.parse(ex.sets) : ex.sets
            })) : []
        }));
        res.json({ success: true, workouts: parsedWorkouts });
    } catch (error) {
        console.error('Hiba a heti edzések lekérésekor:', error);
        res.status(500).json({ error: error.message });
    }
});

// -------------------- EDZÉS FRISSÍTÉSE (szerkesztés) --------------------
app.put('/api/workouts/:workoutId', async (req, res) => {
    const { workoutId } = req.params;
    const { name, workoutType, scheduledDay, exercises } = req.body;
    if (!name || !workoutType || !scheduledDay || !exercises || exercises.length === 0) {
        return res.status(400).json({ error: 'Minden mező kitöltése kötelező!' });
    }
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query(`UPDATE workouts SET name = ?, workout_type = ?, scheduled_day = ? WHERE id = ?`, [name, workoutType, scheduledDay, workoutId]);
        await connection.query(`DELETE FROM workout_exercises WHERE workout_id = ?`, [workoutId]);
        for (let ex of exercises) {
            await connection.query(`INSERT INTO workout_exercises (workout_id, muscle_group, exercise_name, sets_data, sort_order) VALUES (?, ?, ?, ?, ?)`, [workoutId, ex.muscleGroup, ex.name, JSON.stringify(ex.sets), ex.sortOrder || 0]);
        }
        await connection.commit();
        res.json({ success: true, message: 'Edzés sikeresen frissítve!' });
    } catch (error) {
        await connection.rollback();
        console.error('Hiba a frissítéskor:', error);
        res.status(500).json({ error: 'Szerverhiba frissítés közben!' });
    } finally {
        connection.release();
    }
});

// -------------------- PROFILKÉP FELTÖLTÉSE --------------------
app.post('/api/upload-profile-image', async (req, res) => {
    const { userId, imageBase64 } = req.body;
    if (!userId || !imageBase64) {
        return res.status(400).json({ error: 'Hiányzó adatok!' });
    }
    try {
        // Ellenőrizzük, hogy a profile_image oszlop létezik-e
        const [columns] = await pool.query(`SHOW COLUMNS FROM users LIKE 'profile_image'`);
        if (columns.length === 0) {
            await pool.query(`ALTER TABLE users ADD COLUMN profile_image LONGTEXT NULL`);
            console.log('✅ Hozzáadva a profile_image oszlop a users táblához');
        }
        await pool.query('UPDATE users SET profile_image = ? WHERE id = ?', [imageBase64, userId]);
        res.json({ success: true, message: 'Profilkép elmentve!' });
    } catch (error) {
        console.error('Hiba a profil kép mentésekor:', error);
        res.status(500).json({ error: 'Szerverhiba a kép mentésekor!' });
    }
});

// -------------------- PROFILKÉP LEKÉRÉSE --------------------
app.get('/api/user-profile/:userId', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT profile_image FROM users WHERE id = ?', [req.params.userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Felhasználó nem található' });
        res.json({ success: true, profileImage: rows[0].profile_image });
    } catch (error) {
        res.status(500).json({ error: 'Szerverhiba!' });
    }
});

// -------------------- SZERVER INDÍTÁSA --------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => { console.log(`🚀 Szerver fut a ${PORT}-es porton`); });