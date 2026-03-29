-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Gép: db
-- Létrehozás ideje: 2026. Már 29. 09:11
-- Kiszolgáló verziója: 8.0.45
-- PHP verzió: 8.3.26

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Adatbázis: `powerplan`
--

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `challenges`
--

CREATE TABLE `challenges` (
  `id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text,
  `target_value` int NOT NULL,
  `reward_points` int NOT NULL,
  `icon_class` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `nutrition_logs`
--

CREATE TABLE `nutrition_logs` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `meal_type` enum('breakfast','lunch','dinner','snack') NOT NULL,
  `food_name` varchar(255) NOT NULL,
  `description` text,
  `calories` int NOT NULL,
  `protein_g` int DEFAULT '0',
  `carbs_g` int DEFAULT '0',
  `fat_g` int DEFAULT '0',
  `consumed_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `nutrition_logs`
--

INSERT INTO `nutrition_logs` (`id`, `user_id`, `meal_type`, `food_name`, `description`, `calories`, `protein_g`, `carbs_g`, `fat_g`, `consumed_date`, `created_at`) VALUES
(1, 1, 'breakfast', 'Zabkása banánnal', '', 350, 0, 0, 0, '2026-03-27', '2026-03-27 09:03:13'),
(2, 1, 'breakfast', 'Zabkása banánnal', '', 350, 0, 0, 0, '2026-03-27', '2026-03-27 09:03:13');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `users`
--

CREATE TABLE `users` (
  `id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `fitness_goal` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `fitness_goal`, `created_at`, `updated_at`) VALUES
(1, 'elek teszt', 'tesztelek@gmail.com', '$2b$10$0mAKtpNhkrQ5tj/XymzFW.hpEDZjlFy4JH8uoQn./w68IYWTxSXRK', 'muscle-gain', '2026-03-20 12:09:05', '2026-03-20 12:09:05'),
(2, 'elek tesz2', 'tesztelek2@gmail.com', '$2b$10$JcdmXHeIs.Wd0eW4wFTLnObWQQ1zoIgGzNfza/1QheoFivlKFovP2', 'muscle-gain', '2026-03-20 12:50:20', '2026-03-20 12:50:20'),
(3, 'Tóth Márton', 'toth.marton.mate@gmail.com', '$2b$10$oNrolo1RIXnoK5/b5dutU.KofY9GyRHgN/fL3u4iH7GA74Zc57Rou', 'general-fitness', '2026-03-27 12:58:19', '2026-03-27 12:58:19');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user_badges`
--

CREATE TABLE `user_badges` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `badge_name` varchar(100) NOT NULL,
  `description` text,
  `icon_class` varchar(50) DEFAULT NULL,
  `color1` varchar(20) DEFAULT NULL,
  `color2` varchar(20) DEFAULT NULL,
  `earned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user_challenges`
--

CREATE TABLE `user_challenges` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `challenge_id` int NOT NULL,
  `current_progress` int DEFAULT '0',
  `is_completed` tinyint(1) DEFAULT '0',
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user_questionnaires`
--

CREATE TABLE `user_questionnaires` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `height_cm` decimal(5,2) NOT NULL,
  `weight_kg` decimal(5,2) NOT NULL,
  `birth_date` date NOT NULL,
  `activity_level` enum('sedentary','light','moderate','very') NOT NULL,
  `experience_level` enum('never','beginner','intermediate','advanced') NOT NULL,
  `weekly_training_days` enum('0','1-2','3-4','5+') NOT NULL,
  `training_types` json DEFAULT NULL,
  `current_injury` varchar(50) DEFAULT 'no',
  `chronic_conditions` json DEFAULT NULL,
  `medications` text,
  `main_goal` varchar(50) NOT NULL,
  `goal_timeframe` varchar(50) NOT NULL,
  `specific_goal` text,
  `motivations` json DEFAULT NULL,
  `sleep_hours` decimal(4,1) DEFAULT '7.0',
  `stress_level` int DEFAULT '5',
  `sitting_time` enum('low','medium','high') NOT NULL,
  `diet_types` json DEFAULT NULL,
  `allergies` text,
  `diet_control_level` int DEFAULT '5',
  `wants_diet_recommendations` enum('yes','no','maybe') NOT NULL,
  `training_location` enum('gym','home','outdoor') NOT NULL,
  `preferred_workout_duration_mins` int NOT NULL,
  `preferred_weekly_frequency` varchar(10) NOT NULL,
  `physique_satisfaction` int DEFAULT '5',
  `energy_level` int DEFAULT '5',
  `obstacles` json DEFAULT NULL,
  `additional_comments` text,
  `completed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `user_questionnaires`
--

INSERT INTO `user_questionnaires` (`id`, `user_id`, `gender`, `height_cm`, `weight_kg`, `birth_date`, `activity_level`, `experience_level`, `weekly_training_days`, `training_types`, `current_injury`, `chronic_conditions`, `medications`, `main_goal`, `goal_timeframe`, `specific_goal`, `motivations`, `sleep_hours`, `stress_level`, `sitting_time`, `diet_types`, `allergies`, `diet_control_level`, `wants_diet_recommendations`, `training_location`, `preferred_workout_duration_mins`, `preferred_weekly_frequency`, `physique_satisfaction`, `energy_level`, `obstacles`, `additional_comments`, `completed_at`) VALUES
(1, 1, 'male', 180.00, 159.90, '2008-03-06', 'sedentary', 'beginner', '0', '[\"cardio\"]', 'no', '[]', '', 'weightLoss', '1month', '', '[\"health\"]', 8.0, 4, 'medium', '[\"none\"]', 'igen,minden\n', 10, 'maybe', 'outdoor', 30, '2', 10, 1, '[\"money\"]', 'rossz az oldal,gagyi', '2026-03-20 12:11:11'),
(2, 2, 'male', 160.00, 160.00, '2008-02-26', 'sedentary', 'beginner', '3-4', '[\"cardio\", \"weight\"]', 'no', '[]', '', 'strength', '6months', '', '[\"appearance\"]', 8.5, 7, 'medium', '[\"none\"]', '', 4, 'no', 'gym', 45, '3', 5, 5, '[\"time\"]', '', '2026-03-20 12:52:08'),
(3, 3, 'male', 170.00, 80.00, '2005-06-23', 'moderate', 'never', '0', '[\"home\"]', 'no', '[\"heart\", \"diabetes\", \"bloodPressure\"]', '', 'muscleGain', '1month', '', '[\"health\", \"appearance\", \"performance\", \"confidence\"]', 4.0, 10, 'high', '[\"none\"]', '', 1, 'maybe', 'outdoor', 30, '2', 10, 1, '[\"knowledge\", \"time\", \"motivation\", \"money\"]', '', '2026-03-27 13:01:01');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user_settings`
--

CREATE TABLE `user_settings` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `notifications_enabled` tinyint(1) DEFAULT '1',
  `dark_mode_enabled` tinyint(1) DEFAULT '1',
  `measurement_unit` enum('metric','imperial') DEFAULT 'metric',
  `workout_reminder_time` time DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `user_subscriptions`
--

CREATE TABLE `user_subscriptions` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `plan_type` enum('basic','premium','pro') NOT NULL DEFAULT 'basic',
  `start_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `end_date` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `weight_logs`
--

CREATE TABLE `weight_logs` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `weight_kg` decimal(5,2) NOT NULL,
  `logged_at` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `workouts`
--

CREATE TABLE `workouts` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `workout_type` enum('push','pull','legs','full_body','cardio','hiit') NOT NULL,
  `scheduled_day` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `duration_mins` int DEFAULT NULL,
  `is_completed` tinyint(1) DEFAULT '0',
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `workouts`
--

INSERT INTO `workouts` (`id`, `user_id`, `name`, `workout_type`, `scheduled_day`, `duration_mins`, `is_completed`, `completed_at`, `created_at`) VALUES
(1, 1, 'Március 20 lábnap', 'legs', 'friday', NULL, 0, NULL, '2026-03-20 12:37:14'),
(2, 2, 'Március 20 lábnap', 'push', 'friday', NULL, 0, NULL, '2026-03-20 12:53:41'),
(3, 2, 'nagyon fontos edzés', 'push', 'friday', NULL, 0, NULL, '2026-03-20 13:02:35');

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `workout_exercises`
--

CREATE TABLE `workout_exercises` (
  `id` int NOT NULL,
  `workout_id` int NOT NULL,
  `muscle_group` varchar(50) NOT NULL,
  `exercise_name` varchar(100) NOT NULL,
  `sets_data` json NOT NULL,
  `sort_order` int DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `workout_exercises`
--

INSERT INTO `workout_exercises` (`id`, `workout_id`, `muscle_group`, `exercise_name`, `sets_data`, `sort_order`) VALUES
(1, 2, 'Mell', 'Kábelkereszt', '[{\"rpe\": \"8\", \"reps\": \"5\", \"weight\": \"10\"}]', 0),
(2, 3, 'Mell', 'Fekvenyomás (Kézisúlyzó)', '[{\"rpe\": \"1\", \"reps\": \"1\", \"weight\": \"1\"}, {\"rpe\": \"1\", \"reps\": \"2\", \"weight\": \"2\"}]', 0),
(3, 3, 'Mell', 'Tárogatás', '[{\"rpe\": \"1\", \"reps\": \"1\", \"weight\": \"4\"}, {\"rpe\": \"3\", \"reps\": \"2\", \"weight\": \"7\"}]', 0);

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `nutrition_logs`
--
ALTER TABLE `nutrition_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- A tábla indexei `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- A tábla indexei `user_badges`
--
ALTER TABLE `user_badges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- A tábla indexei `user_challenges`
--
ALTER TABLE `user_challenges`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `challenge_id` (`challenge_id`);

--
-- A tábla indexei `user_questionnaires`
--
ALTER TABLE `user_questionnaires`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- A tábla indexei `user_settings`
--
ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- A tábla indexei `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- A tábla indexei `weight_logs`
--
ALTER TABLE `weight_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- A tábla indexei `workouts`
--
ALTER TABLE `workouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- A tábla indexei `workout_exercises`
--
ALTER TABLE `workout_exercises`
  ADD PRIMARY KEY (`id`),
  ADD KEY `workout_id` (`workout_id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `nutrition_logs`
--
ALTER TABLE `nutrition_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `user_badges`
--
ALTER TABLE `user_badges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `user_challenges`
--
ALTER TABLE `user_challenges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `user_questionnaires`
--
ALTER TABLE `user_questionnaires`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `user_settings`
--
ALTER TABLE `user_settings`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `weight_logs`
--
ALTER TABLE `weight_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `workouts`
--
ALTER TABLE `workouts`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT a táblához `workout_exercises`
--
ALTER TABLE `workout_exercises`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Megkötések a kiírt táblákhoz
--

--
-- Megkötések a táblához `nutrition_logs`
--
ALTER TABLE `nutrition_logs`
  ADD CONSTRAINT `nutrition_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `user_badges`
--
ALTER TABLE `user_badges`
  ADD CONSTRAINT `user_badges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `user_challenges`
--
ALTER TABLE `user_challenges`
  ADD CONSTRAINT `user_challenges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_challenges_ibfk_2` FOREIGN KEY (`challenge_id`) REFERENCES `challenges` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `user_questionnaires`
--
ALTER TABLE `user_questionnaires`
  ADD CONSTRAINT `user_questionnaires_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `user_settings`
--
ALTER TABLE `user_settings`
  ADD CONSTRAINT `user_settings_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `user_subscriptions`
--
ALTER TABLE `user_subscriptions`
  ADD CONSTRAINT `user_subscriptions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `weight_logs`
--
ALTER TABLE `weight_logs`
  ADD CONSTRAINT `weight_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `workouts`
--
ALTER TABLE `workouts`
  ADD CONSTRAINT `workouts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Megkötések a táblához `workout_exercises`
--
ALTER TABLE `workout_exercises`
  ADD CONSTRAINT `workout_exercises_ibfk_1` FOREIGN KEY (`workout_id`) REFERENCES `workouts` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
