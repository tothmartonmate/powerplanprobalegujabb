const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const DB_RETRY_DELAY_MS = 5000;
const DB_MAX_RETRIES = 30;

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'powerplan',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeUserRole = (value) => (String(value || '').trim().toLowerCase() === 'admin' ? 'admin' : 'user');

let progressImageColumnPromise;
let workoutSchemaPromise;
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

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const DAILY_MEAL_LIBRARY = {
    breakfast: [
        { name: 'Fehérjedús zabkása bogyós gyümölcsökkel', desc: 'Lassú felszívódású szénhidrát, jó reggeli indulás.', diets: ['balanced', 'vegetarian'], allergens: ['lactose', 'gluten'], goals: ['weightLoss', 'muscleGain', 'fitness', 'strength'] },
        { name: 'Tojásrántotta teljes kiőrlésű pirítóssal', desc: 'Magas fehérje, stabil energiaszint.', diets: ['balanced', 'vegetarian'], allergens: ['egg', 'gluten'], goals: ['muscleGain', 'fitness', 'strength'] },
        { name: 'Avokádós pirítós paradicsommal', desc: 'Könnyebb, kiegyensúlyozott reggeli.', diets: ['balanced', 'vegetarian', 'vegan'], allergens: ['gluten'], goals: ['weightLoss', 'fitness'] },
        { name: 'Görög joghurt magvakkal és almával', desc: 'Fehérjés és gyorsan fogyasztható opció.', diets: ['balanced', 'vegetarian'], allergens: ['lactose', 'nuts'], goals: ['weightLoss', 'fitness', 'muscleGain'] },
        { name: 'Chia puding kókusztejjel', desc: 'Tejmentes, könnyen emészthető reggeli.', diets: ['balanced', 'vegetarian', 'vegan', 'keto'], allergens: [], goals: ['weightLoss', 'fitness', 'muscleGain'] },
        { name: 'Tofu scramble zöldségekkel', desc: 'Növényi alapú, fehérjedús reggeli.', diets: ['vegan', 'vegetarian'], allergens: ['soy'], goals: ['fitness', 'muscleGain', 'weightLoss'] },
        { name: 'Sajtos omlett spenóttal', desc: 'Alacsonyabb szénhidrát, laktató reggeli.', diets: ['balanced', 'vegetarian', 'keto'], allergens: ['egg', 'lactose'], goals: ['weightLoss', 'strength', 'fitness'] },
        { name: 'Lazacos tojásos tál', desc: 'Keto-barát, fehérjében gazdag reggeli.', diets: ['balanced', 'keto'], allergens: ['egg', 'fish'], goals: ['weightLoss', 'strength', 'muscleGain'] }
    ],
    lunch: [
        { name: 'Grillezett csirkemell barna rizzsel és salátával', desc: 'Klasszikus, jól tervezhető ebéd.', diets: ['balanced'], allergens: [], goals: ['weightLoss', 'fitness', 'muscleGain'] },
        { name: 'Pulykamell édesburgonyával és brokkolival', desc: 'Izomépítéshez erős ebéd opció.', diets: ['balanced'], allergens: [], goals: ['muscleGain', 'strength', 'fitness'] },
        { name: 'Lencsés quinoa tál sült zöldségekkel', desc: 'Rostban gazdag vegetáriánus ebéd.', diets: ['vegetarian', 'vegan'], allergens: [], goals: ['weightLoss', 'fitness'] },
        { name: 'Tofus zöldségwok karfiolrizzsel', desc: 'Tejmentes, növényi alapú könnyebb fogás.', diets: ['vegan', 'vegetarian'], allergens: ['soy'], goals: ['weightLoss', 'fitness'] },
        { name: 'Marhahús bulgurral és zöldbabbal', desc: 'Nagyobb energiaszükséglethez igazított ebéd.', diets: ['balanced'], allergens: ['gluten'], goals: ['muscleGain', 'strength'] },
        { name: 'Lazac salátával és avokádóval', desc: 'Alacsonyabb szénhidrát, jó zsiradékokkal.', diets: ['balanced', 'keto'], allergens: ['fish'], goals: ['weightLoss', 'fitness', 'strength'] },
        { name: 'Csirkés cézár saláta kruton nélkül', desc: 'Diétásabb, fehérjedús választás.', diets: ['balanced', 'keto'], allergens: ['egg', 'lactose', 'fish'], goals: ['weightLoss', 'fitness'] },
        { name: 'Vegetáriánus curry csicseriborsóval', desc: 'Meleg, laktató húsmentes ebéd.', diets: ['vegetarian', 'vegan'], allergens: [], goals: ['fitness', 'muscleGain'] }
    ],
    dinner: [
        { name: 'Sült hekk párolt zöldségekkel', desc: 'Könnyebb vacsora, magas fehérjetartalommal.', diets: ['balanced'], allergens: ['fish'], goals: ['weightLoss', 'fitness'] },
        { name: 'Csirkés tortilla tál', desc: 'Jó esti regenerációhoz, kontrollált szénhidráttal.', diets: ['balanced'], allergens: ['gluten'], goals: ['fitness', 'muscleGain'] },
        { name: 'Túrókrém zöldséghasábokkal', desc: 'Gyors, magas fehérjés vacsora.', diets: ['balanced', 'vegetarian'], allergens: ['lactose'], goals: ['weightLoss', 'fitness'] },
        { name: 'Sült tofu saláta olívás dresszinggel', desc: 'Növényi alapú, könnyű vacsora.', diets: ['vegan', 'vegetarian'], allergens: ['soy'], goals: ['weightLoss', 'fitness'] },
        { name: 'Marhahúsgolyók sült zöldségekkel', desc: 'Tartalmasabb esti étkezés aktív napokra.', diets: ['balanced', 'keto'], allergens: ['egg'], goals: ['strength', 'muscleGain'] },
        { name: 'Rántottas gombával és salátával', desc: 'Alacsonyabb szénhidrát, jól telít.', diets: ['balanced', 'vegetarian', 'keto'], allergens: ['egg'], goals: ['weightLoss', 'fitness'] },
        { name: 'Grillezett pulyka kuszkusszal', desc: 'Kiegyensúlyozott esti főétel.', diets: ['balanced'], allergens: ['gluten'], goals: ['fitness', 'muscleGain'] },
        { name: 'Vegán Buddha-tál hummusszal', desc: 'Színes, rostos és növényi vacsora.', diets: ['vegan', 'vegetarian'], allergens: ['sesame'], goals: ['fitness', 'weightLoss'] }
    ],
    snack: [
        { name: 'Alma mandulával', desc: 'Egyszerű, gyors snack két étkezés között.', diets: ['balanced', 'vegetarian', 'vegan'], allergens: ['nuts'], goals: ['weightLoss', 'fitness'] },
        { name: 'Skyr áfonyával', desc: 'Magas fehérje, alacsonyabb kalória.', diets: ['balanced', 'vegetarian'], allergens: ['lactose'], goals: ['weightLoss', 'fitness', 'muscleGain'] },
        { name: 'Fehérjeturmix banánnal', desc: 'Edzés körüli praktikus kiegészítés.', diets: ['balanced', 'vegetarian'], allergens: ['lactose'], goals: ['muscleGain', 'strength'] },
        { name: 'Humusz répa- és uborkahasábokkal', desc: 'Növényi alapú, könnyű snack.', diets: ['vegan', 'vegetarian'], allergens: ['sesame'], goals: ['weightLoss', 'fitness'] },
        { name: 'Főtt tojás és paprika', desc: 'Egyszerű, sós snack.', diets: ['balanced', 'vegetarian', 'keto'], allergens: ['egg'], goals: ['weightLoss', 'strength', 'fitness'] },
        { name: 'Avokádókrém magvas keksszel', desc: 'Egészséges zsírokkal támogatott köztes étkezés.', diets: ['balanced', 'vegetarian'], allergens: ['gluten', 'sesame'], goals: ['fitness'] },
        { name: 'Kókuszos chiapuding', desc: 'Desszertszerű, de kontrollált snack.', diets: ['vegan', 'vegetarian', 'keto'], allergens: [], goals: ['weightLoss', 'fitness'] },
        { name: 'Diómix és bogyós gyümölcs', desc: 'Energiadúsabb köztes étkezés.', diets: ['balanced', 'vegetarian', 'vegan', 'keto'], allergens: ['nuts'], goals: ['muscleGain', 'strength', 'fitness'] }
    ]
};

const DAILY_MEAL_RATIOS = {
    breakfast: 0.25,
    lunch: 0.35,
    dinner: 0.25,
    snack: 0.15
};

const DAILY_MEAL_LABELS = {
    breakfast: 'Reggeli',
    lunch: 'Ebéd',
    dinner: 'Vacsora',
    snack: 'Snack'
};

const getDietPreference = (dietTypes) => {
    const normalizedDietTypes = parseJsonArray(dietTypes).map(normalizeText);
    if (normalizedDietTypes.includes('vegan')) return 'vegan';
    if (normalizedDietTypes.includes('vegetarian')) return 'vegetarian';
    if (normalizedDietTypes.includes('keto')) return 'keto';
    return 'balanced';
};

const getAllergyFlags = (allergies) => {
    const normalizedAllergies = normalizeText(allergies);
    return {
        lactose: /lakt|tej|sajt|joghurt|tejsz|vaj|túró|turo/.test(normalizedAllergies),
        gluten: /glut|búza|buza|liszt|kenyér|kenyer|tészta|teszta/.test(normalizedAllergies),
        egg: /tojás|tojas/.test(normalizedAllergies),
        nuts: /dió|dio|mogyor|mandula|kesu|kesudió|pisztácia|pisztacia/.test(normalizedAllergies),
        fish: /hal|lazac|tonhal|hekk|pisztráng|pisztrang|tőkehal|tokehal/.test(normalizedAllergies),
        soy: /szója|szoja|tofu/.test(normalizedAllergies),
        sesame: /szezám|szezam|tahini/.test(normalizedAllergies)
    };
};

const getRecommendedCalories = (goal, weightKg) => {
    const safeWeight = Number(weightKg) > 0 ? Number(weightKg) : 75;
    if (goal === 'weightLoss') return Math.round(Math.max(1400, safeWeight * 24));
    if (goal === 'muscleGain') return Math.round(Math.max(2200, safeWeight * 33));
    if (goal === 'strength') return Math.round(Math.max(2400, safeWeight * 32));
    return Math.round(Math.max(1800, safeWeight * 28));
};

const isMealCompatible = (meal, dietPreference, allergyFlags, goal) => {
    if (goal && Array.isArray(meal.goals) && !meal.goals.includes(goal)) {
        return false;
    }

    if (dietPreference === 'vegan' && !meal.diets.includes('vegan')) {
        return false;
    }
    if (dietPreference === 'vegetarian' && !meal.diets.some((diet) => diet === 'vegetarian' || diet === 'vegan')) {
        return false;
    }
    if (dietPreference === 'keto' && !meal.diets.includes('keto')) {
        return false;
    }

    return !Object.entries(allergyFlags).some(([allergy, enabled]) => enabled && meal.allergens.includes(allergy));
};

const pickDeterministicMeal = (mealType, candidates, seed) => {
    if (!candidates.length) return null;
    const index = Math.abs(seed + mealType.length * 11) % candidates.length;
    return candidates[index];
};

const buildDailyRecommendations = ({ userId, goal, weightKg, dietTypes, allergies, wantsDietRecommendations }) => {
    if (wantsDietRecommendations === 'no') {
        return {
            recommendations: [],
            calorieTarget: 0,
            recommendationDate: new Date().toISOString().split('T')[0],
            recommendationDateLabel: new Date().toLocaleDateString('hu-HU'),
            recommendationNote: 'A kérdőív alapján nem kértél étrendi ajánlást.'
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daySeed = Math.floor(today.getTime() / 86400000) + Number(userId || 0) * 17;
    const dietPreference = getDietPreference(dietTypes);
    const allergyFlags = getAllergyFlags(allergies);
    const calorieTarget = getRecommendedCalories(goal, weightKg);

    const recommendations = Object.keys(DAILY_MEAL_LIBRARY).map((mealType, index) => {
        const allMeals = DAILY_MEAL_LIBRARY[mealType];
        const filteredMeals = allMeals.filter((meal) => isMealCompatible(meal, dietPreference, allergyFlags, goal));
        const fallbackMeals = filteredMeals.length > 0
            ? filteredMeals
            : allMeals.filter((meal) => !Object.entries(allergyFlags).some(([allergy, enabled]) => enabled && meal.allergens.includes(allergy)));
        const selectedMeal = pickDeterministicMeal(mealType, fallbackMeals.length > 0 ? fallbackMeals : allMeals, daySeed + index * 13);
        const calories = Math.round(calorieTarget * DAILY_MEAL_RATIOS[mealType]);

        return {
            meal_type: mealType,
            mealTypeLabel: DAILY_MEAL_LABELS[mealType],
            name: selectedMeal?.name || 'Ajánlás nem elérhető',
            description: selectedMeal?.desc || 'Ehhez a kombinációhoz jelenleg nincs pontos ajánlat.',
            calories
        };
    });

    return {
        recommendations,
        calorieTarget,
        recommendationDate: today.toISOString().split('T')[0],
        recommendationDateLabel: today.toLocaleDateString('hu-HU'),
        recommendationNote: 'Az ajánlott étrend 24 óránként automatikusan frissül a kérdőív adatai alapján.'
    };
};

const WORKOUT_DAY_OPTIONS = {
    '0': ['monday', 'wednesday'],
    '1-2': ['monday', 'thursday'],
    '2': ['monday', 'thursday'],
    '3': ['monday', 'wednesday', 'friday'],
    '3-4': ['monday', 'wednesday', 'friday', 'saturday'],
    '4': ['monday', 'tuesday', 'thursday', 'friday'],
    '5+': ['monday', 'tuesday', 'wednesday', 'friday', 'saturday']
};

const WORKOUT_DAY_LABELS = {
    monday: 'Hétfő',
    tuesday: 'Kedd',
    wednesday: 'Szerda',
    thursday: 'Csütörtök',
    friday: 'Péntek',
    saturday: 'Szombat',
    sunday: 'Vasárnap'
};

const getExercisePrescription = (goal, experienceLevel, exerciseName, exerciseIndex) => {
    const normalizedGoal = normalizeText(goal);
    const normalizedExperience = normalizeText(experienceLevel);
    const normalizedExercise = normalizeText(exerciseName);
    const isAccessory = /bicepsz|tricepsz|oldalemelés|oldalemeles|vádli|vadli|has|plank|core|mobilit|nyújt|nyujt/.test(normalizedExercise);
    const isCardio = /fut|bicikli|kerékpár|kerekpar|séta|seta|intervall|mobilizáció|mobilizacio|nyújt|nyujt/.test(normalizedExercise);

    if (isCardio) {
        if (normalizedGoal === 'weightloss') return exerciseIndex === 0 ? '1 x 25-35 perc' : '1 x 10-15 perc';
        return exerciseIndex === 0 ? '1 x 20-30 perc' : '1 x 8-12 perc';
    }

    if (normalizedGoal === 'strength') {
        return isAccessory
            ? (normalizedExperience === 'advanced' ? '4 x 8-10' : '3 x 10-12')
            : (normalizedExperience === 'advanced' ? '5 x 4-6' : '4 x 5-8');
    }

    if (normalizedGoal === 'musclegain') {
        return isAccessory
            ? (normalizedExperience === 'beginner' ? '3 x 12-15' : '4 x 10-12')
            : (normalizedExperience === 'beginner' ? '3 x 8-10' : '4 x 8-10');
    }

    if (normalizedGoal === 'weightloss') {
        return isAccessory ? '3 x 12-15' : '3 x 10-12';
    }

    return isAccessory ? '3 x 12-15' : '3 x 8-12';
};

const withExercisePrescriptions = (goal, experienceLevel, exercises) => exercises.map((exerciseName, exerciseIndex) => ({
    name: exerciseName,
    prescription: getExercisePrescription(goal, experienceLevel, exerciseName, exerciseIndex)
}));

const buildWorkoutRecommendation = ({ goal, experienceLevel, weeklyTrainingDays, trainingTypes, trainingLocation, preferredWeeklyFrequency, wantsWorkoutPlanRecommendation }) => {
    const normalizedGoal = normalizeText(goal);
    const normalizedExperience = normalizeText(experienceLevel);
    const normalizedTrainingTypes = parseJsonArray(trainingTypes).map(normalizeText);
    const normalizedLocation = normalizeText(trainingLocation);
    const frequencyKey = normalizeText(preferredWeeklyFrequency || weeklyTrainingDays);
    const selectedDays = WORKOUT_DAY_OPTIONS[frequencyKey] || WORKOUT_DAY_OPTIONS[normalizeText(weeklyTrainingDays)] || ['monday', 'wednesday', 'friday'];

    let template = [];
    let recommendationNote = 'A mintaedzésterv a céljaid és a kérdőív válaszai alapján készült.';

    if (normalizedGoal === 'musclegain') {
        template = [
            { type: 'upper', title: 'Felsőtest erősítés', exercises: ['Fekvenyomás', 'Evezés', 'Vállból nyomás', 'Bicepsz karhajlítás rúddal', 'Tricepsz letolás csigán'] },
            { type: 'lower', title: 'Alsótest alap', exercises: ['Guggolás', 'Lábnyomás', 'Combhajlító gép', 'Álló vádliemelés', 'Hasprés padon'] },
            { type: 'full_body', title: 'Teljes testes volumen', exercises: ['Ferdepados nyomás', 'Lehúzás csigán', 'Kitörés', 'Oldalemelés', 'Plank'] },
            { type: 'upper', title: 'Felsőtest hipertrofia', exercises: ['Tárogatás', 'Döntött törzsű evezés', 'Oldalemelés', 'Kalapács bicepsz', 'Tricepsz letolás'] },
            { type: 'lower', title: 'Alsótest + törzs', exercises: ['Román felhúzás', 'Bolgár guggolás', 'Lábhajlítás gépen', 'Ülő vádliemelés', 'Haskerék'] }
        ];
    } else if (normalizedGoal === 'strength') {
        template = [
            { type: 'push', title: 'Nyomó nap', exercises: ['Fekvenyomás', 'Vállból nyomás', 'Tolódzkodás', 'Tricepsz szűk nyomás'] },
            { type: 'pull', title: 'Húzó nap', exercises: ['Felhúzás', 'Evezés', 'Húzódzkodás', 'Bicepsz rúddal'] },
            { type: 'legs', title: 'Láb nap', exercises: ['Guggolás', 'Előlguggolás', 'Combfeszítő', 'Vádli'] },
            { type: 'full_body', title: 'Technikai teljes test', exercises: ['Könnyű guggolás', 'Könnyű fekvenyomás', 'Evezés', 'Törzs'] }
        ];
        recommendationNote = 'Az edzésterv minta az erőfejlesztő alapgyakorlatokra helyezi a hangsúlyt.';
    } else if (normalizedGoal === 'weightloss') {
        template = [
            { type: 'full_body', title: 'Teljes testes kör', exercises: ['Guggolás', 'Fekvőtámasz', 'Evezés', 'Kitörés', 'Plank'] },
            { type: 'cardio', title: 'Kardió és mobilitás', exercises: ['Tempós séta vagy bicikli 35 perc', 'Mobilizáció', 'Nyújtás'] },
            { type: 'full_body', title: 'Teljes testes erősítés', exercises: ['Kettlebell swing', 'Lehúzás csigán', 'Vállból nyomás', 'Hasprés'] },
            { type: 'cardio', title: 'Intervall kardió', exercises: ['Intervall futás 20 perc', 'Könnyű core gyakorlatok'] }
        ];
        recommendationNote = 'A mintaedzésterv a kalóriafelhasználást és a fenntartható terhelést támogatja.';
    } else {
        template = [
            { type: 'full_body', title: 'Általános teljes test', exercises: ['Guggolás', 'Fekvenyomás', 'Lehúzás', 'Oldalemelés', 'Plank'] },
            { type: 'cardio', title: 'Kardió és állóképesség', exercises: ['Kocogás vagy kerékpár 30 perc', 'Mobilitás', 'Nyújtás'] },
            { type: 'upper', title: 'Felsőtest tónus', exercises: ['Ferdepados nyomás', 'Evezés', 'Bicepsz karhajlítás kézi súlyzóval', 'Tricepsz nyújtás fej fölött'] },
            { type: 'lower', title: 'Alsótest stabilitás', exercises: ['Kitörés', 'Lábnyomás', 'Csípőemelés padon', 'Fordított hasprés'] }
        ];
    }

    if (normalizedTrainingTypes.includes('cardio') && !template.some((entry) => entry.type === 'cardio')) {
        template.push({ type: 'cardio', title: 'Kardió blokk', exercises: ['Futópad 25-30 perc', 'Rövid mobilizáció', 'Levezetés'] });
    }

    if (normalizedLocation === 'home') {
        template = template.map((entry) => ({
            ...entry,
            exercises: entry.exercises.map((exercise) => {
                if (exercise === 'Fekvenyomás') return 'Fekvőtámasz';
                if (exercise === 'Lehúzás csigán') return 'Gumiszalagos lehúzás';
                if (exercise === 'Lábnyomás') return 'Guggolás';
                return exercise;
            })
        }));
        recommendationNote += ' Az otthoni környezethez igazított gyakorlatokkal.';
    }

    const experienceSuffix = normalizedExperience === 'beginner'
        ? 'Kezdő terheléssel, fókuszban a technika.'
        : normalizedExperience === 'advanced'
            ? 'Haladó bontással és nagyobb heti volumennel.'
            : 'Közepes terheléssel és fokozatos fejlődéssel.';

    return {
        recommendedPlan: selectedDays.map((day, index) => {
            const selectedTemplate = template[index % template.length];
            return {
                day,
                dayLabel: WORKOUT_DAY_LABELS[day] || day,
                workoutType: selectedTemplate.type,
                title: selectedTemplate.title,
                exercises: withExercisePrescriptions(goal, experienceLevel, selectedTemplate.exercises)
            };
        }),
        recommendationNote: `${recommendationNote} ${experienceSuffix}`.trim()
    };
};

const WORKOUT_TYPE_STORAGE_MAP = {
    push: 'push',
    pull: 'pull',
    leg: 'legs',
    legs: 'legs',
    upper: 'upper',
    lower: 'lower',
    'full body': 'full_body',
    full_body: 'full_body',
    arms: 'arms',
    cardio: 'cardio',
    hiit: 'hiit'
};

const normalizeWorkoutType = (value) => {
    const normalized = String(value || '').trim().toLowerCase();
    return WORKOUT_TYPE_STORAGE_MAP[normalized] || normalized;
};

const ensureWorkoutSchema = async () => {
    if (!workoutSchemaPromise) {
        workoutSchemaPromise = (async () => {
            try {
                const [workoutTypeColumn] = await pool.query("SHOW COLUMNS FROM workouts LIKE 'workout_type'");
                if (workoutTypeColumn.length === 0) {
                    return;
                }

                const expectedDefinition = "enum('push','pull','legs','upper','lower','full_body','arms','cardio','hiit')";
                const currentDefinition = String(workoutTypeColumn[0].Type || '').toLowerCase();

                if (currentDefinition !== expectedDefinition) {
                    await pool.query(`
                        ALTER TABLE workouts
                        MODIFY COLUMN workout_type ENUM('push','pull','legs','upper','lower','full_body','arms','cardio','hiit') NOT NULL
                    `);
                    console.log('✅ Frissítve a workout_type enum a workouts táblában');
                }
            } catch (error) {
                console.error('❌ Hiba az edzés séma előkészítésekor:', error.message);
            }
        })();
    }

    return workoutSchemaPromise;
};

const ensureAdminSchema = async () => {
    try {
        const [roleColumn] = await pool.query("SHOW COLUMNS FROM users LIKE 'role'");
        const [adminColumn] = await pool.query("SHOW COLUMNS FROM users LIKE 'is_admin'");

        if (roleColumn.length === 0) {
            await pool.query(`
                ALTER TABLE users
                ADD COLUMN role ENUM('user', 'admin')
                CHARACTER SET utf8mb4 COLLATE utf8mb4_hungarian_ci
                NOT NULL DEFAULT 'user'
            `);
            console.log('✅ Hozzáadva a role oszlop a users táblához');
        }

        if (adminColumn.length > 0) {
            await pool.query("UPDATE users SET role = 'admin' WHERE is_admin = 1");
        }

        await pool.query(`
            CREATE TABLE IF NOT EXISTS contact_messages (
                id INT NOT NULL AUTO_INCREMENT,
                user_id INT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                subject VARCHAR(150) NOT NULL,
                message TEXT NOT NULL,
                admin_reply TEXT NULL,
                status ENUM('new', 'replied') NOT NULL DEFAULT 'new',
                created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                replied_at TIMESTAMP NULL DEFAULT NULL,
                PRIMARY KEY (id),
                KEY idx_contact_messages_user_id (user_id),
                CONSTRAINT fk_contact_messages_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);
    } catch (error) {
        console.error('❌ Hiba az admin séma előkészítésekor:', error.message);
    }
};

const isAdminUser = async (userId) => {
    if (!userId) return false;
    const [rows] = await pool.query('SELECT role FROM users WHERE id = ? LIMIT 1', [userId]);
    return rows.length > 0 && normalizeUserRole(rows[0].role) === 'admin';
};

const requireAdmin = async (userId, res) => {
    const allowed = await isAdminUser(userId);
    if (!allowed) {
        res.status(403).json({ error: 'Nincs admin jogosultság!' });
        return false;
    }
    return true;
};

const initializeDatabase = async () => {
    for (let attempt = 1; attempt <= DB_MAX_RETRIES; attempt += 1) {
        try {
            const connection = await pool.getConnection();
            console.log('✅ Sikeresen csatlakozva a MySQL adatbázishoz!');
            connection.release();
            await ensureAdminSchema();
            await ensureWorkoutSchema();
            return;
        } catch (error) {
            console.error(`❌ Hiba az adatbázis csatlakozáskor (próba ${attempt}/${DB_MAX_RETRIES}):`, error.message);
            if (attempt === DB_MAX_RETRIES) {
                console.error('❌ Az adatbázis nem vált elérhetővé időben.');
                return;
            }
            await wait(DB_RETRY_DELAY_MS);
        }
    }
};

initializeDatabase();

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
        const [users] = await pool.query('SELECT id, full_name, email, password_hash, profile_image, role FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: 'Hibás adatok!' });
        const user = users[0];
        const role = normalizeUserRole(user.role);
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Hibás adatok!' });
        const token = Buffer.from(`${user.id}-${Date.now()}`).toString('base64');
        res.status(200).json({ 
            success: true, 
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                profile_image: user.profile_image,
                role,
                is_admin: role === 'admin'
            },
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
                current_injury, chronic_conditions, medications, main_goal, goal_timeframe, specific_goal, motivations, wants_workout_plan_recommendations,
                sleep_hours, stress_level, sitting_time, diet_types, allergies, diet_control_level, wants_diet_recommendations,
                training_location, preferred_workout_duration_mins, preferred_weekly_frequency, physique_satisfaction, energy_level, obstacles, additional_comments
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                gender=VALUES(gender), height_cm=VALUES(height_cm), weight_kg=VALUES(weight_kg), 
                birth_date=VALUES(birth_date), main_goal=VALUES(main_goal), allergies=VALUES(allergies),
                activity_level=VALUES(activity_level), experience_level=VALUES(experience_level),
                weekly_training_days=VALUES(weekly_training_days),
                wants_workout_plan_recommendations=VALUES(wants_workout_plan_recommendations)
        `;
        const values = [
            userId, q.personalInfo.gender, q.personalInfo.height, q.personalInfo.weight, q.personalInfo.birthDate, q.personalInfo.activity,
            q.trainingExperience.frequency, q.trainingExperience.weeklyTraining, JSON.stringify(q.trainingExperience.trainingTypes || []),
            q.healthInfo.currentInjury || 'no', JSON.stringify(q.healthInfo.chronicConditions || []), q.healthInfo.medications,
            q.goals.mainGoal, q.goals.timeframe, q.goals.specificGoal, JSON.stringify(q.goals.motivation || []), q.goals.workoutPlanRecommendation || 'no',
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
                    motivation: parseJsonArray(row.motivations),
                    workoutPlanRecommendation: row.wants_workout_plan_recommendations || 'no'
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
        const [qRows] = await pool.query(
            'SELECT main_goal, weight_kg, diet_types, allergies, wants_diet_recommendations, wants_workout_plan_recommendations, experience_level, weekly_training_days, training_types, training_location, preferred_weekly_frequency FROM user_questionnaires WHERE user_id = ?',
            [userId]
        );
        const questionnaire = qRows[0] || null;
        let recommendedMeals = [];
        let dailyDietPlan = { recommendations: [], calorieTarget: 0, recommendationDate: '', recommendationDateLabel: '', recommendationNote: '' };
        let workoutPlanRecommendation = buildWorkoutRecommendation({
            goal: questionnaire?.main_goal || 'fitness',
            experienceLevel: questionnaire?.experience_level || 'beginner',
            weeklyTrainingDays: questionnaire?.weekly_training_days || '2',
            trainingTypes: questionnaire?.training_types || JSON.stringify(['strength']),
            trainingLocation: questionnaire?.training_location || 'gym',
            preferredWeeklyFrequency: questionnaire?.preferred_weekly_frequency || questionnaire?.weekly_training_days || '2',
            wantsWorkoutPlanRecommendation: questionnaire?.wants_workout_plan_recommendations || 'yes'
        });
        let recommendedWorkoutText = 'Heti 3x Teljes testes átmozgató edzés.';
        if (questionnaire) {
            const goal = questionnaire.main_goal;
            const allergies = questionnaire.allergies ? questionnaire.allergies.toLowerCase() : '';
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

            dailyDietPlan = buildDailyRecommendations({
                userId,
                goal,
                weightKg: questionnaire.weight_kg,
                dietTypes: questionnaire.diet_types,
                allergies: questionnaire.allergies,
                wantsDietRecommendations: questionnaire.wants_diet_recommendations
            });
        } else {
            workoutPlanRecommendation.recommendationNote = 'A mintaedzésterv akkor is elérhető, ha még nem töltötted ki teljesen a kérdőívet.';
        }
        const [weightRows] = await pool.query(
            'SELECT weight_kg as weight, logged_at as date FROM weight_logs WHERE user_id = ? ORDER BY logged_at ASC, created_at ASC',
            [userId]
        );

        res.json({
            success: true,
            nutrition: {
                todayMeals: meals,
                dailyCalories: meals.reduce((sum, meal) => sum + meal.calories, 0),
                macros: { protein: 0, carbs: 0, fat: 0 },
                recommendations: dailyDietPlan.recommendations,
                legacyRecommendations: recommendedMeals,
                calorieTarget: dailyDietPlan.calorieTarget,
                recommendationDate: dailyDietPlan.recommendationDate,
                recommendationDateLabel: dailyDietPlan.recommendationDateLabel,
                recommendationNote: dailyDietPlan.recommendationNote
            },
            workout: {
                weeklyPlan: Object.values(groupedWorkouts),
                stats: { totalWorkouts: Object.keys(groupedWorkouts).length, completedWorkouts: 0 },
                aiRecommendation: recommendedWorkoutText,
                recommendedPlan: workoutPlanRecommendation.recommendedPlan,
                recommendationNote: workoutPlanRecommendation.recommendationNote
            },
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

    const normalizedWorkoutType = normalizeWorkoutType(workoutType);
    if (!normalizedWorkoutType) {
        return res.status(400).json({ error: 'Érvénytelen edzés típus!' });
    }

    const connection = await pool.getConnection();
    try {
        await ensureWorkoutSchema();
        await connection.beginTransaction();
        const [wResult] = await connection.query(
            'INSERT INTO workouts (user_id, name, workout_type, scheduled_day) VALUES (?, ?, ?, ?)',
            [userId, name, normalizedWorkoutType, scheduledDay]
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

    const normalizedWorkoutType = normalizeWorkoutType(workoutType);
    if (!normalizedWorkoutType) {
        return res.status(400).json({ error: 'Érvénytelen edzés típus!' });
    }

    const connection = await pool.getConnection();
    try {
        await ensureWorkoutSchema();
        await connection.beginTransaction();
        await connection.query(`UPDATE workouts SET name = ?, workout_type = ?, scheduled_day = ? WHERE id = ?`, [name, normalizedWorkoutType, scheduledDay, workoutId]);
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

app.delete('/api/workouts/:workoutId', async (req, res) => {
    const { workoutId } = req.params;
    const { userId } = req.query;

    if (!workoutId || !userId) {
        return res.status(400).json({ error: 'Hiányzó edzés vagy felhasználó azonosító!' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [workouts] = await connection.query(
            'SELECT id FROM workouts WHERE id = ? AND user_id = ? LIMIT 1',
            [workoutId, userId]
        );

        if (!workouts.length) {
            await connection.rollback();
            return res.status(404).json({ error: 'Az edzés nem található!' });
        }

        await connection.query('DELETE FROM workout_exercises WHERE workout_id = ?', [workoutId]);
        await connection.query('DELETE FROM workouts WHERE id = ? AND user_id = ?', [workoutId, userId]);

        await connection.commit();
        res.json({ success: true, message: 'Edzés törölve!' });
    } catch (error) {
        await connection.rollback();
        console.error('Hiba az edzés törlésekor:', error);
        res.status(500).json({ error: 'Szerverhiba törlés közben!' });
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
        const [rows] = await pool.query('SELECT profile_image, role FROM users WHERE id = ?', [req.params.userId]);
        if (rows.length === 0) return res.status(404).json({ error: 'Felhasználó nem található' });
        const role = normalizeUserRole(rows[0].role);
        res.json({ success: true, profileImage: rows[0].profile_image, role, isAdmin: role === 'admin' });
    } catch (error) {
        res.status(500).json({ error: 'Szerverhiba!' });
    }
});

// -------------------- KAPCSOLAT ÜZENET --------------------
app.post('/api/contact', async (req, res) => {
    const { userId, name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Minden mező kitöltése kötelező!' });
    }

    try {
        await pool.query(
            `INSERT INTO contact_messages (user_id, name, email, subject, message)
             VALUES (?, ?, ?, ?, ?)`,
            [userId || null, String(name).trim(), String(email).trim(), String(subject).trim(), String(message).trim()]
        );

        return res.status(201).json({ success: true, message: 'Üzenet elküldve!' });
    } catch (error) {
        console.error('Hiba kapcsolat üzenet mentésekor:', error);
        return res.status(500).json({ error: 'Szerverhiba történt!' });
    }
});

// -------------------- ADMIN ÁTTEKINTÉS --------------------
app.get('/api/admin/overview/:userId', async (req, res) => {
    const adminUserId = Number(req.params.userId);

    try {
        if (!(await requireAdmin(adminUserId, res))) return;

        const [messages] = await pool.query(
            `SELECT id, user_id as userId, name, email, subject, message, admin_reply as adminReply, status,
                    created_at as createdAt, replied_at as repliedAt
             FROM contact_messages
             ORDER BY created_at DESC`
        );

        const [users] = await pool.query(
            `SELECT id, full_name as fullName, email, fitness_goal as fitnessGoal, total_points as totalPoints,
                    current_level as currentLevel, profile_image as profileImage, role,
                    created_at as createdAt, updated_at as updatedAt
             FROM users
             ORDER BY created_at DESC`
        );

        return res.json({
            success: true,
            messages,
            users: users.map((user) => ({
                ...user,
                role: normalizeUserRole(user.role),
                isAdmin: normalizeUserRole(user.role) === 'admin'
            }))
        });
    } catch (error) {
        console.error('Hiba admin áttekintés lekérésekor:', error);
        return res.status(500).json({ error: 'Szerverhiba történt!' });
    }
});

app.put('/api/admin/messages/:messageId/reply', async (req, res) => {
    const adminUserId = Number(req.body.adminUserId);
    const messageId = Number(req.params.messageId);
    const replyMessage = String(req.body.replyMessage || '').trim();

    if (!messageId || !replyMessage) {
        return res.status(400).json({ error: 'Az üzenet azonosítója és a válasz kötelező!' });
    }

    try {
        if (!(await requireAdmin(adminUserId, res))) return;

        await pool.query(
            `UPDATE contact_messages
             SET admin_reply = ?, status = 'replied', replied_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [replyMessage, messageId]
        );

        return res.json({ success: true, message: 'Válasz elmentve!' });
    } catch (error) {
        console.error('Hiba admin válasz mentésekor:', error);
        return res.status(500).json({ error: 'Szerverhiba történt!' });
    }
});

app.put('/api/admin/users/:targetUserId', async (req, res) => {
    const adminUserId = Number(req.body.adminUserId);
    const targetUserId = Number(req.params.targetUserId);
    const { fullName, email, fitnessGoal, totalPoints, currentLevel, role } = req.body;

    if (!targetUserId || !fullName || !email) {
        return res.status(400).json({ error: 'A név, email és azonosító kötelező!' });
    }

    try {
        if (!(await requireAdmin(adminUserId, res))) return;

        const normalizedRole = normalizeUserRole(role);

        await pool.query(
            `UPDATE users
             SET full_name = ?,
                 email = ?,
                 fitness_goal = ?,
                 total_points = ?,
                 current_level = ?,
                 role = ?
             WHERE id = ?`,
            [
                String(fullName).trim(),
                String(email).trim(),
                fitnessGoal || null,
                Number.isFinite(Number(totalPoints)) ? Number(totalPoints) : 0,
                Number.isFinite(Number(currentLevel)) ? Number(currentLevel) : 1,
                normalizedRole,
                targetUserId
            ]
        );

        return res.json({ success: true, message: 'Felhasználó frissítve!' });
    } catch (error) {
        console.error('Hiba admin felhasználó frissítéskor:', error);
        return res.status(500).json({ error: 'Szerverhiba történt!' });
    }
});

// -------------------- SZERVER INDÍTÁSA --------------------
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => { console.log(`🚀 Szerver fut a ${PORT}-es porton`); });