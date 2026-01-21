-- phpMyAdmin SQL Dump
-- LifeLine Database Setup Script
-- Updated with JSON mapping columns and dummy data
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
-- Each column stores a JSON object mapping int -> meaning
-- --------------------------------------------------------

CREATE TABLE `indexes` (
  `IID` int(11) NOT NULL AUTO_INCREMENT,
  `type` ENUM('location', 'message', 'help', 'status') NOT NULL,
  `mapping` JSON NOT NULL COMMENT 'JSON object mapping integer codes to meanings',
  `description` text DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`IID`),
  UNIQUE KEY `type_unique` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `devices`
-- Registered LoRa devices in the mesh network
-- --------------------------------------------------------

CREATE TABLE `devices` (
  `DID` int(10) NOT NULL AUTO_INCREMENT,
  `device_name` varchar(100) DEFAULT NULL,
  `LID` int(10) NOT NULL COMMENT 'Location ID mapped from indexes',
  `status` ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  `battery_level` int(3) DEFAULT 100,
  `last_ping` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`DID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `helps`
-- Help resources and responders
-- --------------------------------------------------------

CREATE TABLE `helps` (
  `HID` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `contact` varchar(50) NOT NULL,
  `type` varchar(50) DEFAULT 'general' COMMENT 'Type of help: medical, rescue, evacuation, etc.',
  `eta` varchar(50) DEFAULT NULL COMMENT 'Estimated time of arrival',
  `status` ENUM('available', 'dispatched', 'busy') DEFAULT 'available',
  `location` varchar(200) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`HID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `messages`
-- Emergency messages received from LoRa devices
-- --------------------------------------------------------

CREATE TABLE `messages` (
  `MID` int(10) NOT NULL AUTO_INCREMENT,
  `DID` int(10) NOT NULL COMMENT 'Device ID that sent the message',
  `RSSI` int(10) DEFAULT NULL COMMENT 'Signal strength indicator',
  `message_code` int(10) NOT NULL COMMENT 'Message code mapped from indexes',
  `priority` ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  `status` ENUM('pending', 'acknowledged', 'resolved', 'escalated') DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` datetime DEFAULT NULL,
  PRIMARY KEY (`MID`),
  KEY `fk_device` (`DID`),
  CONSTRAINT `fk_device` FOREIGN KEY (`DID`) REFERENCES `devices` (`DID`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- INSERT DUMMY DATA
-- --------------------------------------------------------

-- Insert default admin user (password: admin123 - hashed with password_hash)
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

-- Help type mapping: Integer code -> Help category
('help', '{
  "1": "Helicopter Rescue",
  "2": "Ground Search Team",
  "3": "Medical Team",
  "4": "Food and Supplies",
  "5": "Shelter Assistance",
  "6": "Communication Support",
  "7": "Evacuation Team",
  "8": "Fire Response",
  "9": "Technical Support",
  "10": "General Assistance"
}', 'Maps help request codes to assistance types'),

-- Status mapping: Integer code -> Device/System status
('status', '{
  "0": "Offline",
  "1": "Online - Normal",
  "2": "Online - Low Battery",
  "3": "Online - Critical Battery",
  "4": "Maintenance Mode",
  "5": "Error State"
}', 'Maps status codes to device states');

-- Insert dummy devices (LoRa nodes)
INSERT INTO `devices` (`device_name`, `LID`, `status`, `battery_level`, `last_ping`) VALUES
('Node-Namche-01', 1, 'active', 95, NOW()),
('Node-Lukla-01', 2, 'active', 88, DATE_SUB(NOW(), INTERVAL 5 MINUTE)),
('Node-Tengboche-01', 3, 'active', 72, DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
('Node-Dingboche-01', 4, 'active', 100, DATE_SUB(NOW(), INTERVAL 2 MINUTE)),
('Node-GorakShep-01', 5, 'inactive', 15, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
('Node-Phakding-01', 6, 'active', 67, DATE_SUB(NOW(), INTERVAL 8 MINUTE)),
('Node-Khumjung-01', 7, 'maintenance', 90, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('Node-Pangboche-01', 8, 'active', 45, DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
('Node-Pheriche-01', 9, 'active', 82, DATE_SUB(NOW(), INTERVAL 3 MINUTE)),
('Node-Lobuche-01', 10, 'active', 55, DATE_SUB(NOW(), INTERVAL 20 MINUTE));

-- Insert dummy help resources
INSERT INTO `helps` (`name`, `contact`, `type`, `eta`, `status`, `location`) VALUES
('Nepal Army Helicopter Unit', '+977-1-4412345', 'rescue', '30-45 mins', 'available', 'Kathmandu'),
('Himalayan Rescue Association', '+977-1-4440292', 'medical', '1-2 hours', 'available', 'Pheriche'),
('Khumbu Rescue Team', '+977-38-540116', 'rescue', '2-4 hours', 'available', 'Namche Bazaar'),
('Everest ER Clinic', '+977-38-540071', 'medical', '30 mins', 'available', 'Lukla'),
('Local Sherpa Rescue', '+977-9841234567', 'rescue', '1 hour', 'dispatched', 'Tengboche'),
('Red Cross Nepal', '+977-1-4270650', 'general', '4-6 hours', 'available', 'Kathmandu'),
('Mountain Medicine Center', '+977-1-4411890', 'medical', '3-4 hours', 'available', 'Kathmandu'),
('Emergency Food Supply', '+977-9851234567', 'supplies', '6-8 hours', 'available', 'Namche Bazaar');

-- Insert dummy emergency messages
INSERT INTO `messages` (`DID`, `RSSI`, `message_code`, `priority`, `status`, `notes`, `timestamp`) VALUES
(1, -65, 1, 'high', 'acknowledged', 'Trekker showing signs of AMS at 3440m', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(2, -72, 15, 'low', 'resolved', 'Routine check-in, all normal', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(4, -58, 2, 'critical', 'pending', 'Climber injured during descent, possible fracture', DATE_SUB(NOW(), INTERVAL 10 MINUTE)),
(6, -80, 6, 'high', 'acknowledged', 'Minor landslide blocking trail near Phakding', DATE_SUB(NOW(), INTERVAL 45 MINUTE)),
(8, -68, 11, 'medium', 'pending', 'Heavy snowfall expected, visibility decreasing', DATE_SUB(NOW(), INTERVAL 20 MINUTE)),
(9, -55, 3, 'high', 'escalated', 'Tourist with severe stomach illness', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(3, -75, 15, 'low', 'resolved', 'Weather cleared, trails passable', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(10, -82, 14, 'medium', 'pending', 'Intermittent communication with base', DATE_SUB(NOW(), INTERVAL 5 MINUTE));

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
