-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Gép: db
-- Létrehozás ideje: 2026. Már 29. 09:19
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
-- Tábla szerkezet ehhez a táblához `diet_templates`
--

CREATE TABLE `diet_templates` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `goal` enum('weightLoss','muscleGain','strength','fitness') NOT NULL,
  `daily_calories` int NOT NULL,
  `description` text,
  `schedule` json NOT NULL,
  `macros` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `diet_templates`
--

INSERT INTO `diet_templates` (`id`, `name`, `goal`, `daily_calories`, `description`, `schedule`, `macros`, `created_at`) VALUES
(1, 'Zsírégető Kezdő', 'weightLoss', 1800, 'Alacsony szénhidrát, magas fehérje tartalmú étrend.', '{\"lunch\": \"Grillezett csirkemell (150g) + párolt brokkoli (200g) + barna rizs (80g)\", \"snack\": \"Görög joghurt (150g) + marék dió\", \"dinner\": \"Tonhal saláta (120g tonhal, vegyes zöldség, olívaolaj)\", \"breakfast\": \"Zabkása (40g) + 1 alma + 3 tojásfehérje\"}', '{\"fat\": \"50g\", \"carbs\": \"150g\", \"protein\": \"120g\"}', '2026-03-29 09:15:14'),
(2, 'Zsírégető Haladó', 'weightLoss', 1600, 'Ketogén jellegű, alacsony szénhidrát étrend.', '{\"lunch\": \"Sült lazac (150g) + avokádó saláta\", \"snack\": \"Fehérje shake (1 gombóc) + mandula (20g)\", \"dinner\": \"Grillezett csirkemell (150g) + spenót (200g)\", \"breakfast\": \"Omlett (3 tojás, sonka, zöldségek)\"}', '{\"fat\": \"70g\", \"carbs\": \"50g\", \"protein\": \"130g\"}', '2026-03-29 09:15:14'),
(3, 'Izomépítő Kezdő', 'muscleGain', 2800, 'Magas fehérje, magas szénhidrát étrend.', '{\"lunch\": \"Csirkemell (200g) + édesburgonya (250g) + zöldségek\", \"snack\": \"Görög joghurt (200g) + zabpehely (40g) + fehérje shake\", \"dinner\": \"Marhahús (200g) + barna rizs (100g) + brokkoli\", \"breakfast\": \"Zabkása (80g) + banán + 4 tojás + méz\"}', '{\"fat\": \"70g\", \"carbs\": \"300g\", \"protein\": \"180g\"}', '2026-03-29 09:15:14'),
(4, 'Izomépítő Haladó', 'muscleGain', 3200, 'Tömegnövelő, magas kalóriatartalmú étrend.', '{\"lunch\": \"Marhahús (250g) + quinoa (150g) + édesburgonya (200g)\", \"snack\": \"Túró (250g) + dió (30g) + fehérje shake + rizskása (50g)\", \"dinner\": \"Lazac (200g) + barna rizs (100g) + spárga\", \"breakfast\": \"Zabkása (100g) + 2 banán + 5 tojás + mogyoróvaj\"}', '{\"fat\": \"90g\", \"carbs\": \"350g\", \"protein\": \"200g\"}', '2026-03-29 09:15:14'),
(5, 'Erőemelő Étrend', 'strength', 3000, 'Energiadús étrend a maximális erőfejlesztéshez.', '{\"lunch\": \"Csirkecomb (250g) + krumplipüré (300g) + zöldségek\", \"snack\": \"Túró (200g) + fehérje shake + kenyér (2 szelet)\", \"dinner\": \"Marhapörkölt (200g) + tarhonya (100g) + savanyúság\", \"breakfast\": \"Zabkása (100g) + 4 tojás + méz + banán\"}', '{\"fat\": \"80g\", \"carbs\": \"320g\", \"protein\": \"190g\"}', '2026-03-29 09:15:14'),
(6, 'Funkcionális Fitness', 'fitness', 2400, 'Egyensúlyozott makrókkal, változatos ételekkel.', '{\"lunch\": \"Grillezett csirkemell (180g) + quinoa (100g) + vegyes saláta\", \"snack\": \"Gyümölcsök + görög joghurt\", \"dinner\": \"Hal (150g) + bulgur (80g) + párolt zöldségek\", \"breakfast\": \"Teljes kiőrlésű kenyér (2 szelet) + avokádó + 3 tojás\"}', '{\"fat\": \"60g\", \"carbs\": \"220g\", \"protein\": \"140g\"}', '2026-03-29 09:15:14'),
(7, 'Vegetáriánus Étrend', 'fitness', 2200, 'Növényi alapú, magas fehérjetartalmú étrend.', '{\"lunch\": \"Tofu (200g) + quinoa (100g) + zöldségek\", \"snack\": \"Fehérje shake + dió (30g) + alma\", \"dinner\": \"Csicseriborsó curry (250g) + barna rizs (80g)\", \"breakfast\": \"Zabkása (60g) + fehérje por + banán + mandula\"}', '{\"fat\": \"55g\", \"carbs\": \"250g\", \"protein\": \"120g\"}', '2026-03-29 09:15:14'),
(8, 'Alacsony Szénhidrát', 'weightLoss', 1700, 'Keto stílusú, alacsony szénhidrát étrend.', '{\"lunch\": \"Grillezett lazac (180g) + spenót (200g) + avokádó\", \"snack\": \"Mogyoró (30g) + fehérje shake\", \"dinner\": \"Csirkemell (180g) + zöldségmix (200g) + olívaolaj\", \"breakfast\": \"Omlett (4 tojás, sajt, bacon)\"}', '{\"fat\": \"85g\", \"carbs\": \"40g\", \"protein\": \"130g\"}', '2026-03-29 09:15:14'),
(9, 'Magas Fehérje', 'muscleGain', 2600, 'Fokozott fehérjebevitel az izomépítéshez.', '{\"lunch\": \"Csirkemell (200g) + barna rizs (100g) + brokkoli\", \"snack\": \"Görög joghurt (200g) + dió + fehérje szelet\", \"dinner\": \"Túró (250g) + magvak + fehérje shake\", \"breakfast\": \"Zabkása (60g) + fehérje por + 3 tojás\"}', '{\"fat\": \"60g\", \"carbs\": \"180g\", \"protein\": \"200g\"}', '2026-03-29 09:15:14'),
(10, 'Teljes értékű alap', 'fitness', 2100, 'Minimálisan feldolgozott ételek, egészséges összetétel.', '{\"lunch\": \"Lencseleves + teljes kiőrlésű kenyér + zöldségek\", \"snack\": \"Alma + mandula + görög joghurt\", \"dinner\": \"Grillezett hal (150g) + quinoa (80g) + vegyes saláta\", \"breakfast\": \"Zabkása (50g) + friss gyümölcs + chia mag\"}', '{\"fat\": \"50g\", \"carbs\": \"230g\", \"protein\": \"100g\"}', '2026-03-29 09:15:14');

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
  `total_points` int DEFAULT '0',
  `current_level` int DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `fitness_goal`, `total_points`, `current_level`, `created_at`, `updated_at`) VALUES
(1, 'elek teszt', 'tesztelek@gmail.com', '$2b$10$0mAKtpNhkrQ5tj/XymzFW.hpEDZjlFy4JH8uoQn./w68IYWTxSXRK', 'muscle-gain', 0, 1, '2026-03-20 12:09:05', '2026-03-20 12:09:05'),
(2, 'elek tesz2', 'tesztelek2@gmail.com', '$2b$10$JcdmXHeIs.Wd0eW4wFTLnObWQQ1zoIgGzNfza/1QheoFivlKFovP2', 'muscle-gain', 0, 1, '2026-03-20 12:50:20', '2026-03-20 12:50:20');

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
-- Tábla szerkezet ehhez a táblához `user_diet_plan`
--

CREATE TABLE `user_diet_plan` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `template_id` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
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
(2, 2, 'male', 160.00, 160.00, '2008-02-26', 'sedentary', 'beginner', '3-4', '[\"cardio\", \"weight\"]', 'no', '[]', '', 'strength', '6months', '', '[\"appearance\"]', 8.5, 7, 'medium', '[\"none\"]', '', 4, 'no', 'gym', 45, '3', 5, 5, '[\"time\"]', '', '2026-03-20 12:52:08');

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
-- Tábla szerkezet ehhez a táblához `user_workout_plan`
--

CREATE TABLE `user_workout_plan` (
  `id` int NOT NULL,
  `user_id` int NOT NULL,
  `template_id` int NOT NULL,
  `assigned_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
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

-- --------------------------------------------------------

--
-- Tábla szerkezet ehhez a táblához `workout_templates`
--

CREATE TABLE `workout_templates` (
  `id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `goal` enum('weightLoss','muscleGain','strength','fitness') NOT NULL,
  `experience` enum('beginner','intermediate','advanced') NOT NULL,
  `weekly_days` int NOT NULL,
  `description` text,
  `tips` text,
  `schedule` json NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- A tábla adatainak kiíratása `workout_templates`
--

INSERT INTO `workout_templates` (`id`, `name`, `goal`, `experience`, `weekly_days`, `description`, `tips`, `schedule`, `created_at`) VALUES
(1, 'Kezdő Zsírégető', 'weightLoss', 'beginner', 3, 'Heti 3 edzés, kardióval kombinált körzetek. Kezdőknek ideális.', 'Fókuszálj a technikára, ne a súlyra!', '{\"friday\": {\"name\": \"Teljes testes körzet\", \"exercises\": [\"Burpees (3x10)\", \"Plank (3x30mp)\", \"Kettlebell swing (3x12)\", \"Kerékpározás (20 perc)\"]}, \"monday\": {\"name\": \"Kardió + Alsótest\", \"exercises\": [\"Futópad (20 perc)\", \"Guggolás (3x12)\", \"Kitörés (3x10)\", \"Vádli (3x15)\"]}, \"wednesday\": {\"name\": \"Felsőtest erősítés\", \"exercises\": [\"Fekvenyomás (3x10)\", \"Evezés csigán (3x10)\", \"Vállból nyomás (3x10)\", \"Bicepsz (3x12)\"]}}', '2026-03-29 09:15:14'),
(2, 'Haladó Zsírégető', 'weightLoss', 'intermediate', 4, 'Heti 4 edzés, HIIT és erősítés kombinációja.', 'Az edzések között legalább 48 óra pihenőt tarts!', '{\"friday\": {\"name\": \"Aktív pihenő\", \"exercises\": [\"Séta (30 perc)\", \"Nyújtás\", \"Mobilizáció\"]}, \"monday\": {\"name\": \"HIIT + Mell\", \"exercises\": [\"Sprint (30mp) - Pihenő (30mp) x10\", \"Fekvenyomás (4x8)\", \"Tárogatás (3x12)\", \"Tricepsz (3x12)\"]}, \"tuesday\": {\"name\": \"Kardió + Hát\", \"exercises\": [\"Futás (5km)\", \"Húzódzkodás (max x3)\", \"Evezés (4x10)\", \"Bicepsz (3x12)\"]}, \"thursday\": {\"name\": \"HIIT + Láb\", \"exercises\": [\"Burpees (10x10)\", \"Guggolás (4x10)\", \"Lábnyomás (4x12)\", \"Kitörés (3x10)\"]}}', '2026-03-29 09:15:14'),
(3, 'Kezdő Izomépítő', 'muscleGain', 'beginner', 3, 'Heti 3 teljes testes edzés kezdőknek.', 'Egyél kalóriatöbbletben, minimum 1.6g fehérje/testsúlykg!', '{\"friday\": {\"name\": \"Teljes test C\", \"exercises\": [\"Kitörés (3x10)\", \"Döntött törzsű evezés (3x10)\", \"Katonai nyomás (3x10)\", \"Lábnyújtás (3x12)\", \"Plank (3x45mp)\"]}, \"monday\": {\"name\": \"Teljes test A\", \"exercises\": [\"Guggolás (3x10)\", \"Fekvenyomás (3x10)\", \"Evezés (3x10)\", \"Vállból nyomás (3x10)\", \"Bicepsz (3x12)\", \"Tricepsz (3x12)\"]}, \"wednesday\": {\"name\": \"Teljes test B\", \"exercises\": [\"Felhúzás (3x8)\", \"Ferde pados nyomás (3x10)\", \"Lehúzás csigán (3x10)\", \"Oldalemelés (3x12)\", \"Lábnyomás (3x12)\", \"Hasprés (3x15)\"]}}', '2026-03-29 09:15:14'),
(4, 'Haladó Izomépítő - PPL', 'muscleGain', 'intermediate', 5, 'Heti 5 edzés, Push/Pull/Legs split.', 'Progresszív túlterhelés: minden héten próbálj többet emelni!', '{\"friday\": {\"name\": \"Legs + Segéd\", \"exercises\": [\"Felhúzás (3x5)\", \"Guggolás (3x8)\", \"Combfeszítő (3x12)\", \"Combhajlító (3x12)\", \"Has (3x15)\"]}, \"monday\": {\"name\": \"Push (Mell, Váll, Tricepsz)\", \"exercises\": [\"Fekvenyomás (4x8)\", \"Vállból nyomás (4x10)\", \"Ferde pados (3x10)\", \"Oldalemelés (3x12)\", \"Tricepsz letolás (3x12)\"]}, \"tuesday\": {\"name\": \"Pull (Hát, Bicepsz)\", \"exercises\": [\"Húzódzkodás (4xmax)\", \"Evezés (4x10)\", \"Felhúzás (3x5)\", \"Bicepsz rúddal (3x10)\", \"Koncentrált bicepsz (3x12)\"]}, \"thursday\": {\"name\": \"Push + Pull\", \"exercises\": [\"Fekvenyomás (3x8)\", \"Evezés (3x10)\", \"Oldalemelés (3x12)\", \"Bicepsz (3x10)\", \"Tricepsz (3x10)\"]}, \"wednesday\": {\"name\": \"Legs (Láb)\", \"exercises\": [\"Guggolás (4x8)\", \"Lábnyomás (4x12)\", \"Kitörés (3x10)\", \"Vádli (4x15)\"]}}', '2026-03-29 09:15:14'),
(5, 'Erőemelő Kezdő', 'strength', 'beginner', 3, '3 napos erőemelő alapozó program.', 'A nagy hármas (guggolás, fekvenyomás, felhúzás) a legfontosabb!', '{\"friday\": {\"name\": \"Felhúzás fókusz\", \"exercises\": [\"Felhúzás (5x5)\", \"Guggolás (3x8)\", \"Fekvenyomás (3x8)\", \"Evezés (3x10)\"]}, \"monday\": {\"name\": \"Guggolás fókusz\", \"exercises\": [\"Guggolás (5x5)\", \"Fekvenyomás (5x5)\", \"Evezés (5x5)\", \"Lábnyomás (3x10)\"]}, \"wednesday\": {\"name\": \"Fekvenyomás fókusz\", \"exercises\": [\"Fekvenyomás (5x5)\", \"Guggolás (3x8)\", \"Vállból nyomás (3x8)\", \"Felhúzás (3x5)\"]}}', '2026-03-29 09:15:14'),
(6, 'Erőemelő Haladó', 'strength', 'advanced', 4, '4 napos erőemelő program, periodizációval.', 'Tarts edzésnaplót, és havi szinten mérd a maximumaidat!', '{\"friday\": {\"name\": \"Kiegészítő nap\", \"exercises\": [\"Guggolás (3x8)\", \"Fekvenyomás (3x8)\", \"Felhúzás (3x5)\", \"Törzsizomzat (3x12)\"]}, \"monday\": {\"name\": \"Nehéz guggolás\", \"exercises\": [\"Guggolás (3x3)\", \"Nehéz guggolás (2x5)\", \"Lábnyomás (3x10)\", \"Combfeszítő (3x12)\"]}, \"tuesday\": {\"name\": \"Nehéz fekvenyomás\", \"exercises\": [\"Fekvenyomás (3x3)\", \"Ferde pados (3x5)\", \"Katonai nyomás (3x8)\", \"Tricepsz (3x10)\"]}, \"thursday\": {\"name\": \"Erőgyakorlatok\", \"exercises\": [\"Felhúzás (3x3)\", \"Evezés (3x5)\", \"Bicepsz (3x8)\", \"Húzódzkodás (3xmax)\"]}}', '2026-03-29 09:15:14'),
(7, 'Funkcionális Fitness', 'fitness', 'beginner', 3, 'Középpontban a mozgáskoordináció és állóképesség.', 'A mozgásminőség fontosabb, mint a súly!', '{\"friday\": {\"name\": \"Teljes testes körzet\", \"exercises\": [\"Súlyzós kitörés (3x10)\", \"Evezés (3x10)\", \"Vállból nyomás (3x10)\", \"Kettlebell swing (3x12)\", \"Plank (3x60mp)\"]}, \"monday\": {\"name\": \"Funkcionális erősítés\", \"exercises\": [\"Kettlebell swing (3x12)\", \"Guggolás (3x10)\", \"Medicinlabda dobások (3x10)\", \"Plank (3x45mp)\"]}, \"wednesday\": {\"name\": \"Kardió + Koordináció\", \"exercises\": [\"Agility létra (10 perc)\", \"Sprint (6x50m)\", \"Burpees (3x12)\", \"Jumping Jacks (3x30)\"]}}', '2026-03-29 09:15:14'),
(8, 'Kardió és Állóképesség', 'fitness', 'intermediate', 4, 'Futás, úszás, kerékpár kombinációja.', 'Heti 10% szabály: ne növeld a távot 10%-nál többel!', '{\"monday\": {\"name\": \"Futás\", \"exercises\": [\"Könnyű futás (30 perc)\", \"Tempófutás (20 perc)\", \"Lassú kocogás (10 perc)\"]}, \"tuesday\": {\"name\": \"Erősítés\", \"exercises\": [\"Guggolás (3x10)\", \"Kitörés (3x10)\", \"Plank (3x45mp)\", \"Hasprés (3x15)\"]}, \"saturday\": {\"name\": \"Hosszú táv\", \"exercises\": [\"Lassú futás (60 perc)\", \"Nyújtás (15 perc)\"]}, \"thursday\": {\"name\": \"Intervall futás\", \"exercises\": [\"Bemelegítés (10 perc)\", \"Sprint (400m x6)\", \"Levezetés (10 perc)\"]}}', '2026-03-29 09:15:14'),
(9, 'Otthoni Edzés', 'fitness', 'beginner', 4, 'Csak testsúlyos és minimális eszközös edzés otthonra.', 'Ne hagyd ki a bemelegítést és a nyújtást!', '{\"friday\": {\"name\": \"Teljes test\", \"exercises\": [\"Fekvőtámasz (3x12)\", \"Guggolás (3x15)\", \"Plank (3x45mp)\", \"Kitörés (3x10)\", \"Hasprés (3x15)\"]}, \"monday\": {\"name\": \"Felsőtest\", \"exercises\": [\"Fekvőtámasz (3x12)\", \"Inverz evezés (3x10)\", \"Plank (3x45mp)\", \"Dips széken (3x10)\"]}, \"tuesday\": {\"name\": \"Alsótest\", \"exercises\": [\"Guggolás (3x15)\", \"Kitörés (3x10)\", \"Glute bridge (3x15)\", \"Vádli (3x20)\"]}, \"thursday\": {\"name\": \"Kardió\", \"exercises\": [\"Burpees (3x12)\", \"Jumping Jacks (3x30)\", \"Mountain climbers (3x20)\", \"Séta (30 perc)\"]}}', '2026-03-29 09:15:14'),
(10, 'Prémium Haladó Split', 'muscleGain', 'advanced', 6, '6 napos, 3 naponként ismétlődő split edzés.', 'Figyelj a regenerációra! Aludj legalább 8 órát!', '{\"friday\": {\"name\": \"Hát + Bicepsz (2)\", \"exercises\": [\"Lehúzás csigán (4x10)\", \"T-rudas evezés (4x10)\", \"Scott-pad (3x12)\", \"Koncentrált bicepsz (3x12)\"]}, \"monday\": {\"name\": \"Mell + Tricepsz\", \"exercises\": [\"Fekvenyomás (4x8)\", \"Ferde pados (4x10)\", \"Tárogatás (3x12)\", \"Tricepsz letolás (3x12)\", \"Koponyazúzó (3x10)\"]}, \"tuesday\": {\"name\": \"Hát + Bicepsz\", \"exercises\": [\"Húzódzkodás (4xmax)\", \"Evezés (4x10)\", \"Felhúzás (3x5)\", \"Bicepsz rúddal (3x10)\", \"Kalapács bicepsz (3x12)\"]}, \"saturday\": {\"name\": \"Láb + Váll (2)\", \"exercises\": [\"Felhúzás (3x5)\", \"Guggolás (3x8)\", \"Vállvonogatás (3x12)\", \"Előreemelés (3x12)\"]}, \"thursday\": {\"name\": \"Mell + Tricepsz (2)\", \"exercises\": [\"Ferde pados (4x8)\", \"Kábelkereszt (3x12)\", \"Francia nyomás (3x10)\", \"Lórúgás (3x12)\"]}, \"wednesday\": {\"name\": \"Láb + Váll\", \"exercises\": [\"Guggolás (4x8)\", \"Lábnyomás (4x12)\", \"Kitörés (3x10)\", \"Vállból nyomás (4x10)\", \"Oldalemelés (3x12)\"]}}', '2026-03-29 09:15:14');

--
-- Indexek a kiírt táblákhoz
--

--
-- A tábla indexei `challenges`
--
ALTER TABLE `challenges`
  ADD PRIMARY KEY (`id`);

--
-- A tábla indexei `diet_templates`
--
ALTER TABLE `diet_templates`
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
-- A tábla indexei `user_diet_plan`
--
ALTER TABLE `user_diet_plan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `template_id` (`template_id`);

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
-- A tábla indexei `user_workout_plan`
--
ALTER TABLE `user_workout_plan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `template_id` (`template_id`);

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
-- A tábla indexei `workout_templates`
--
ALTER TABLE `workout_templates`
  ADD PRIMARY KEY (`id`);

--
-- A kiírt táblák AUTO_INCREMENT értéke
--

--
-- AUTO_INCREMENT a táblához `challenges`
--
ALTER TABLE `challenges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `diet_templates`
--
ALTER TABLE `diet_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT a táblához `nutrition_logs`
--
ALTER TABLE `nutrition_logs`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `users`
--
ALTER TABLE `users`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT a táblához `user_badges`
--
ALTER TABLE `user_badges`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `user_diet_plan`
--
ALTER TABLE `user_diet_plan`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT a táblához `user_questionnaires`
--
ALTER TABLE `user_questionnaires`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

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
-- AUTO_INCREMENT a táblához `user_workout_plan`
--
ALTER TABLE `user_workout_plan`
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
-- AUTO_INCREMENT a táblához `workout_templates`
--
ALTER TABLE `workout_templates`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

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
-- Megkötések a táblához `user_diet_plan`
--
ALTER TABLE `user_diet_plan`
  ADD CONSTRAINT `user_diet_plan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_diet_plan_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `diet_templates` (`id`) ON DELETE CASCADE;

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
-- Megkötések a táblához `user_workout_plan`
--
ALTER TABLE `user_workout_plan`
  ADD CONSTRAINT `user_workout_plan_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_workout_plan_ibfk_2` FOREIGN KEY (`template_id`) REFERENCES `workout_templates` (`id`) ON DELETE CASCADE;

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
