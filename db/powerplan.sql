CREATE DATABASE IF NOT EXISTS powerplan
CHARACTER SET utf8mb4
COLLATE utf8mb4_hungarian_ci;

USE powerplan;

-- 1. users tábla (Előre kell venni, hogy a többi tábla hivatkozhasson rá!)
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nev VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    jelszo VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. user_settings tábla
CREATE TABLE IF NOT EXISTS user_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE, -- ITT A JAVÍTÁS: UNIQUE lett!
    notification_enabled TINYINT(1) DEFAULT 1,
    data_mode TINYINT(1) DEFAULT 1,
    measurement_unit ENUM('metric', 'imperial') DEFAULT 'metric',
    workunit_reminder_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE -- Szabályos összekötés a users táblával
);

-- 3. notifications tábla
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_settings(user_id) ON DELETE CASCADE
);

-- 4. workouts tábla
CREATE TABLE IF NOT EXISTS workouts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('push', 'pull', 'legs', 'full_body', 'cardio', 'hit') NOT NULL,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    duration INT,
    completed TINYINT(1) DEFAULT 0,
    completed_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. user_exercises tábla
CREATE TABLE IF NOT EXISTS user_exercises (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workout_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    sets INT,
    reps VARCHAR(20),
    weight DECIMAL(5,2),
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE
);

-- 6. questionnaires tábla
CREATE TABLE IF NOT EXISTS questionnaires (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    survey_type ENUM('never', 'beginner', 'intermediate', 'advanced') NOT NULL,
    weekly_frequency INT,
    main_goal ENUM('weight_loss', 'muscle_gain', 'strength', 'general_fitness') NOT NULL,
    has_injuries TINYINT(1) DEFAULT 0,
    private_details TEXT,
    completed TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user_settings(user_id) ON DELETE CASCADE
);