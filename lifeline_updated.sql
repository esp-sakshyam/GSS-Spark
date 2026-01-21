-- phpMyAdmin SQL Dump
-- LifeLine Database Setup Script
-- Updated with JSON mapping columns and dummy data
-- Simplified schema - removed unnecessary columns
--
-- Host: 127.0.0.1
-- Database: `lifeline`

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS `lifeline` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `lifeline`;

-- --------------------------------------------------------
-- Drop existing tables if they exist (for clean setup)
-- --------------------------------------------------------

DROP TABLE IF EXISTS `messages`;
DROP TABLE IF EXISTS `devices`;
DROP TABLE IF EXISTS `helps`;
DROP TABLE IF EXISTS `indexes`;
DROP TABLE IF EXISTS `user`;

-- --------------------------------------------------------
-- Table structure for table `user`
-- Stores admin/operator login credentials
-- --------------------------------------------------------

CREATE TABLE `user` (
  `UID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL UNIQUE,
  `password` varchar(255) NOT NULL,
  `role` ENUM('admin', 'operator') DEFAULT 'operator',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `indexes`
-- Maps integer codes from LoRa devices to meaningful data
-- Each row stores a JSON object mapping int -> meaning
-- Types: location, message, help (which maps HID to message codes)
-- --------------------------------------------------------

CREATE TABLE `indexes` (
  `IID` int(11) NOT NULL AUTO_INCREMENT,
  `type` ENUM('location', 'message', 'help') NOT NULL,
  `mapping` JSON NOT NULL COMMENT 'JSON object mapping integer codes to meanings. For help type: maps HID to array of applicable message codes',
  `description` text DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`IID`),
  UNIQUE KEY `type_unique` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `devices`
-- Registered LoRa devices in the mesh network
-- Simplified: removed battery_level, created_at
-- --------------------------------------------------------

CREATE TABLE `devices` (
  `DID` int(10) NOT NULL AUTO_INCREMENT,
  `device_name` varchar(100) DEFAULT NULL,
  `LID` int(10) NOT NULL COMMENT 'Location ID mapped from indexes',
  `status` ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  `last_ping` datetime DEFAULT NULL,
  PRIMARY KEY (`DID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `helps`
-- Help resources and responders
-- Simplified: removed type, created_at
-- --------------------------------------------------------

CREATE TABLE `helps` (
  `HID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `contact` varchar(50) NOT NULL,
  `eta` varchar(50) DEFAULT NULL COMMENT 'Estimated time of arrival',
  `status` ENUM('available', 'dispatched', 'busy') DEFAULT 'available',
  `location` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`HID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `messages`
-- Emergency messages received from LoRa devices
-- Simplified: removed priority, status, notes, resolved_at
-- --------------------------------------------------------

CREATE TABLE `messages` (
  `MID` int(10) NOT NULL AUTO_INCREMENT,
  `DID` int(10) NOT NULL COMMENT 'Device ID that sent the message',
  `RSSI` int(10) DEFAULT NULL COMMENT 'Signal strength indicator',
  `message_code` int(10) NOT NULL COMMENT 'Message code mapped from indexes',
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`MID`),
  KEY `fk_device` (`DID`),
  CONSTRAINT `fk_device` FOREIGN KEY (`DID`) REFERENCES `devices` (`DID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- INSERT DUMMY DATA
-- --------------------------------------------------------

-- Insert default admin user (password: password - hashed with password_hash)
INSERT INTO `user` (`name`, `email`, `password`, `role`, `last_login`) VALUES
('Admin User', 'admin@lifeline.np', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NOW()),
('Operator One', 'operator1@lifeline.np', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operator', NULL),
('Operator Two', 'operator2@lifeline.np', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'operator', NULL);

-- Insert index mappings for LoRa integer codes
-- Location mapping: Integer code -> Village/Area name
INSERT INTO `indexes` (`type`, `mapping`, `description`) VALUES
('location', '{
  "1": "Namche Bazaar",
  "2": "Lukla Village",
  "3": "Tengboche",
  "4": "Dingboche",
  "5": "Gorak Shep",
  "6": "Phakding",
  "7": "Khumjung",
  "8": "Pangboche",
  "9": "Pheriche",
  "10": "Lobuche",
  "11": "Syangboche",
  "12": "Thame",
  "13": "Gokyo",
  "14": "Machermo",
  "15": "Chhukung"
}', 'Maps location codes to village names in Solukhumbu region'),

-- Message type mapping: Integer code -> Emergency type
('message', '{
  "1": "Medical Emergency - Altitude Sickness",
  "2": "Medical Emergency - Injury",
  "3": "Medical Emergency - Illness",
  "4": "Search and Rescue Required",
  "5": "Avalanche Alert",
  "6": "Landslide Warning",
  "7": "Fire Emergency",
  "8": "Flood Warning",
  "9": "Lost/Missing Person",
  "10": "Equipment Failure",
  "11": "Weather Emergency",
  "12": "Infrastructure Damage",
  "13": "Food/Water Shortage",
  "14": "Communication Lost",
  "15": "All Clear - Situation Normal"
}', 'Maps message codes to emergency types'),

-- Help mapping: Maps HID (Help resource ID) to array of message codes they can respond to
-- This defines which help resources are applicable for which message types
('help', '{
  "1": [1, 2, 3, 4, 5, 9],
  "2": [4, 5, 6, 9],
  "3": [1, 2, 3],
  "4": [1, 2, 3, 4, 9],
  "5": [4, 5, 6, 9],
  "6": [13],
  "7": [1, 2, 3, 11],
  "8": [7, 8, 12, 13]
}', 'Maps Help resource IDs (HID) to arrays of message codes they can respond to. E.g., HID 1 (Helicopter) can respond to message codes 1,2,3,4,5,9');

-- Insert dummy devices (LoRa nodes) - without battery_level
INSERT INTO `devices` (`device_name`, `LID`, `status`, `last_ping`) VALUES
('Node-Namche-01', 1, 'active', NOW()),
('Node-Lukla-01', 2, 'active', DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
('Node-Tengboche-01', 3, 'active', DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
('Node-Dingboche-01', 4, 'active', DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
('Node-GorakShep-01', 5, 'inactive', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('Node-Phakding-01', 6, 'active', DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
('Node-Khumjung-01', 7, 'maintenance', DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Node-Pangboche-01', 8, 'active', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
('Node-Pheriche-01', 9, 'active', DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
('Node-Lobuche-01', 10, 'active', DATE_SUB(NOW(), INTERVAL 20 MINUTE));

-- Insert dummy help resources - without type
INSERT INTO `helps` (`name`, `contact`, `eta`, `status`, `location`) VALUES
('Nepal Army Helicopter Unit', '+977-1-4412345', '30-45 mins', 'available', 'Kathmandu'),
('Khumbu Ground Search Team', '+977-38-540116', '2-4 hours', 'available', 'Namche Bazaar'),
('Himalayan Rescue Association', '+977-1-4440292', '1-2 hours', 'available', 'Pheriche'),
('Everest ER Clinic', '+977-38-540071', '30 mins', 'available', 'Lukla'),
('Local Sherpa Rescue', '+977-9841234567', '1 hour', 'dispatched', 'Tengboche'),
('Emergency Food Supply', '+977-9851234567', '6-8 hours', 'available', 'Namche Bazaar'),
('Mountain Medicine Center', '+977-1-4411890', '3-4 hours', 'available', 'Kathmandu'),
('Red Cross Nepal - Supplies', '+977-1-4270650', '4-6 hours', 'available', 'Kathmandu');

-- Insert dummy emergency messages - without priority, status, notes
INSERT INTO `messages` (`DID`, `RSSI`, `message_code`, `timestamp`) VALUES
(1, -65, 1, DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(2, -72, 15, DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(4, -58, 2, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(6, -80, 6, DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(8, -68, 11, DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
(9, -55, 3, DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(3, -75, 15, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(10, -82, 14, DATE_SUB(NOW(), INTERVAL 5 MINUTE));

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
