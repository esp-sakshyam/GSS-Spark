-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 21, 2026 at 04:52 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `lifeline`
--

-- --------------------------------------------------------

--
-- Table structure for table `indexes`
--

CREATE TABLE `indexes` (
  `IID` int(11) NOT NULL,
  `type` enum('location','message','help') NOT NULL,
  `mapping` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'JSON object mapping integer codes to meanings. For help type: maps HID to array of applicable message codes' CHECK (json_valid(`mapping`)),
  `description` text DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `indexes`
--

INSERT INTO `indexes` (`IID`, `type`, `mapping`, `description`, `updated_at`) VALUES
(1, 'location', '{\n  \"1\": \"Namche Bazaar\",\n  \"2\": \"Lukla Village\",\n  \"3\": \"Tengboche\",\n  \"4\": \"Dingboche\",\n  \"5\": \"Gorak Shep\",\n  \"6\": \"Phakding\",\n  \"7\": \"Khumjung\",\n  \"8\": \"Pangboche\",\n  \"9\": \"Pheriche\",\n  \"10\": \"Lobuche\",\n  \"11\": \"Syangboche\",\n  \"12\": \"Thame\",\n  \"13\": \"Gokyo\",\n  \"14\": \"Machermo\",\n  \"15\": \"Chhukung\"\n}', 'Maps location codes to village names in Solukhumbu region', '2026-01-21 10:11:08'),
(2, 'message', '{\n  \"1\": \"Medical Emergency - Altitude Sickness\",\n  \"2\": \"Medical Emergency - Injury\",\n  \"3\": \"Medical Emergency - Illness\",\n  \"4\": \"Search and Rescue Required\",\n  \"5\": \"Avalanche Alert\",\n  \"6\": \"Landslide Warning\",\n  \"7\": \"Fire Emergency\",\n  \"8\": \"Flood Warning\",\n  \"9\": \"Lost/Missing Person\",\n  \"10\": \"Equipment Failure\",\n  \"11\": \"Weather Emergency\",\n  \"12\": \"Infrastructure Damage\",\n  \"13\": \"Food/Water Shortage\",\n  \"14\": \"Communication Lost\",\n  \"15\": \"All Clear - Situation Normal\"\n}', 'Maps message codes to emergency types', '2026-01-21 10:11:08');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `indexes`
--
ALTER TABLE `indexes`
  ADD PRIMARY KEY (`IID`),
  ADD UNIQUE KEY `type_unique` (`type`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `indexes`
--
ALTER TABLE `indexes`
  MODIFY `IID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
