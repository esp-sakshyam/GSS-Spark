# LifeLine API Documentation

> Emergency Response System REST API for LoRa mesh network communication

**Base URL:** `/API/`

---

## Table of Contents

- [Response Format](#response-format)
- [Authentication](#authentication)
  - [Login](#post-authloginphp)
  - [Check Session](#get-authcheckphp)
  - [Logout](#post-authlogoutphp)
- [Devices](#devices)
  - [Create Device](#post-createdevicephp)
  - [Read Device(s)](#get-readdevicephp)
  - [Update Device](#put-updatedevicephp)
  - [Delete Device](#delete-deletedevicephp)
- [Messages](#messages)
  - [Create Message](#post-createmessagephp)
  - [Read Message(s)](#get-readmessagephp)
  - [Update Message](#put-updatemessagephp)
  - [Delete Message](#delete-deletemessagephp)
- [Help Resources](#help-resources)
  - [Create Help](#post-createhelpsphp)
  - [Read Help(s)](#get-readhelpsphp)
  - [Update Help](#put-updatehelpsphp)
  - [Delete Help](#delete-deletehelpsphp)
- [Index Mappings](#index-mappings)
  - [Create Index](#post-createindexphp)
  - [Read Index(es)](#get-readindexphp)
  - [Update Index](#put-updateindexphp)
  - [Delete Index](#delete-deleteindexphp)

---

## Response Format

All API responses follow this JSON structure:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "timestamp": "2026-01-21 12:00:00"
}
```

| Field       | Type              | Description                        |
| ----------- | ----------------- | ---------------------------------- |
| `success`   | boolean           | Whether the request was successful |
| `data`      | object/array/null | Response payload                   |
| `message`   | string            | Human-readable status message      |
| `timestamp` | string            | Server timestamp                   |

### HTTP Status Codes

| Code | Description                              |
| ---- | ---------------------------------------- |
| 200  | Success                                  |
| 201  | Created                                  |
| 400  | Bad Request (missing/invalid parameters) |
| 401  | Unauthorized                             |
| 404  | Not Found                                |
| 405  | Method Not Allowed                       |
| 409  | Conflict (duplicate entry)               |
| 500  | Server Error                             |

---

## Authentication

### POST `/auth/login.php`

Authenticates a user and creates a session.

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "your_password",
  "remember": true
}
```

| Parameter  | Type    | Required | Description                      |
| ---------- | ------- | -------- | -------------------------------- |
| `email`    | string  | ✅       | User's email address             |
| `password` | string  | ✅       | User's password                  |
| `remember` | boolean | ❌       | Set remember-me cookie (30 days) |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "admin"
    },
    "token": "abc123..."
  },
  "message": "Login successful"
}
```

**Error Response (401):**

```json
{
  "success": false,
  "data": null,
  "message": "Invalid email or password"
}
```

---

### GET `/auth/check.php`

Verifies if the current session is authenticated.

**Parameters:** None (uses session cookies)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "user@example.com",
      "role": "admin"
    }
  },
  "message": "Authenticated"
}
```

**Error Response (401):**

```json
{
  "success": false,
  "data": null,
  "message": "Not authenticated"
}
```

---

### POST `/auth/logout.php`

Terminates the user session and clears cookies.

**Parameters:** None

**Success Response (200):**

```json
{
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

---

## Devices

### POST `/Create/device.php`

Creates a new device in the mesh network.

**Request Body:**

```json
{
  "LID": 1,
  "device_name": "ESP-Node-01",
  "status": "active"
}
```

| Parameter     | Type    | Required | Description                                                            |
| ------------- | ------- | -------- | ---------------------------------------------------------------------- |
| `LID`         | integer | ✅       | Location ID (references index mapping)                                 |
| `device_name` | string  | ❌       | Human-readable device name                                             |
| `status`      | string  | ❌       | Device status: `active`, `inactive`, `maintenance` (default: `active`) |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "DID": 1,
    "device_name": "ESP-Node-01",
    "LID": 1,
    "status": "active",
    "last_ping": "2026-01-21 12:00:00"
  },
  "message": "Device created successfully"
}
```

---

### GET `/Read/device.php`

Retrieves device(s) from the database.

**Query Parameters:**

| Parameter | Type    | Required | Description                              |
| --------- | ------- | -------- | ---------------------------------------- |
| `id`      | integer | ❌       | Get specific device by DID               |
| `status`  | string  | ❌       | Filter by status                         |
| `lid`     | integer | ❌       | Filter by location ID                    |
| `page`    | integer | ❌       | Page number (default: 1)                 |
| `limit`   | integer | ❌       | Results per page (default: 50, max: 100) |

**Examples:**

- Get all devices: `GET /Read/device.php`
- Get specific device: `GET /Read/device.php?id=1`
- Filter by status: `GET /Read/device.php?status=active`
- Filter by location: `GET /Read/device.php?lid=1`

**Success Response (200) - Single Device:**

```json
{
  "success": true,
  "data": {
    "DID": 1,
    "device_name": "ESP-Node-01",
    "LID": 1,
    "status": "active",
    "last_ping": "2026-01-21 12:00:00",
    "location_name": "Namche Bazaar"
  },
  "message": "Device retrieved successfully"
}
```

**Success Response (200) - Multiple Devices:**

```json
{
  "success": true,
  "data": {
    "devices": [...],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  },
  "message": "Devices retrieved successfully"
}
```

---

### PUT `/Update/device.php`

Updates an existing device.

**Request Body:**

```json
{
  "DID": 1,
  "device_name": "ESP-Node-01-Updated",
  "LID": 2,
  "status": "maintenance",
  "last_ping": "2026-01-21 12:00:00"
}
```

| Parameter     | Type    | Required | Description                                     |
| ------------- | ------- | -------- | ----------------------------------------------- |
| `DID`         | integer | ✅       | Device ID to update                             |
| `device_name` | string  | ❌       | New device name                                 |
| `LID`         | integer | ❌       | New location ID                                 |
| `status`      | string  | ❌       | New status: `active`, `inactive`, `maintenance` |
| `last_ping`   | string  | ❌       | Update last ping timestamp                      |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "DID": 1,
    "device_name": "ESP-Node-01-Updated",
    "LID": 2,
    "status": "maintenance",
    "last_ping": "2026-01-21 12:00:00",
    "location_name": "Lukla Village"
  },
  "message": "Device updated successfully"
}
```

---

### DELETE `/Delete/device.php`

Deletes a device from the database.

**Query Parameters:**

| Parameter | Type    | Required | Description         |
| --------- | ------- | -------- | ------------------- |
| `id`      | integer | ✅       | Device ID to delete |

**Example:** `DELETE /Delete/device.php?id=1`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "deleted_id": 1,
    "device_name": "ESP-Node-01"
  },
  "message": "Device deleted successfully"
}
```

> ⚠️ **Warning:** Deleting a device will also cascade delete all associated messages.

---

## Messages

### POST `/Create/message.php`

Creates a new emergency message. Typically called by the LoRa gateway when receiving alerts.

**Request Body:**

```json
{
  "DID": 1,
  "message_code": 1,
  "RSSI": -65
}
```

| Parameter      | Type    | Required | Description                                    |
| -------------- | ------- | -------- | ---------------------------------------------- |
| `DID`          | integer | ✅       | Device ID sending the message                  |
| `message_code` | integer | ✅       | Emergency type code (references index mapping) |
| `RSSI`         | integer | ❌       | Signal strength indicator                      |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "MID": 1,
    "DID": 1,
    "RSSI": -65,
    "message_code": 1,
    "timestamp": "2026-01-21 12:00:00",
    "device_name": "ESP-Node-01",
    "LID": 1,
    "location_name": "Namche Bazaar",
    "message_text": "Medical Emergency - Altitude Sickness"
  },
  "message": "Emergency message created successfully"
}
```

---

### GET `/Read/message.php`

Retrieves emergency message(s) with decoded location and message text.

**Query Parameters:**

| Parameter      | Type    | Required | Description                              |
| -------------- | ------- | -------- | ---------------------------------------- |
| `id`           | integer | ❌       | Get specific message by MID              |
| `did`          | integer | ❌       | Filter by device ID                      |
| `lid`          | integer | ❌       | Filter by location ID                    |
| `message_code` | integer | ❌       | Filter by message code                   |
| `from`         | string  | ❌       | Filter from date (YYYY-MM-DD)            |
| `to`           | string  | ❌       | Filter to date (YYYY-MM-DD)              |
| `page`         | integer | ❌       | Page number (default: 1)                 |
| `limit`        | integer | ❌       | Results per page (default: 50, max: 100) |

**Examples:**

- Get all messages: `GET /Read/message.php`
- Get specific message: `GET /Read/message.php?id=1`
- Filter by device: `GET /Read/message.php?did=1`
- Filter by date range: `GET /Read/message.php?from=2026-01-01&to=2026-01-31`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "MID": 1,
        "DID": 1,
        "RSSI": -65,
        "message_code": 1,
        "timestamp": "2026-01-21 12:00:00",
        "device_name": "ESP-Node-01",
        "LID": 1,
        "device_status": "active",
        "location_name": "Namche Bazaar",
        "message_text": "Medical Emergency - Altitude Sickness"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "pages": 2
    }
  },
  "message": "Messages retrieved successfully"
}
```

---

### PUT `/Update/message.php`

Updates an existing emergency message.

**Request Body:**

```json
{
  "MID": 1,
  "RSSI": -70,
  "message_code": 2
}
```

| Parameter      | Type    | Required | Description             |
| -------------- | ------- | -------- | ----------------------- |
| `MID`          | integer | ✅       | Message ID to update    |
| `RSSI`         | integer | ❌       | Updated signal strength |
| `message_code` | integer | ❌       | Updated message code    |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "MID": 1,
    "DID": 1,
    "RSSI": -70,
    "message_code": 2,
    "timestamp": "2026-01-21 12:00:00",
    "device_name": "ESP-Node-01",
    "LID": 1,
    "location_name": "Namche Bazaar",
    "message_text": "Medical Emergency - Injury"
  },
  "message": "Message updated successfully"
}
```

---

### DELETE `/Delete/message.php`

Deletes an emergency message.

**Query Parameters:**

| Parameter | Type    | Required | Description          |
| --------- | ------- | -------- | -------------------- |
| `id`      | integer | ✅       | Message ID to delete |

**Example:** `DELETE /Delete/message.php?id=1`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "deleted_id": 1,
    "device_name": "ESP-Node-01",
    "message_code": 1,
    "warning": "Warning: Deleting a message that is not resolved"
  },
  "message": "Message deleted successfully"
}
```

> ⚠️ **Note:** In production, messages should be archived rather than deleted.

---

## Help Resources

### POST `/Create/helps.php`

Creates a new help resource (emergency responder/rescue team).

**Request Body:**

```json
{
  "name": "Nepal Army Rescue Team",
  "contact": "+977-1-4412345",
  "eta": "30 minutes",
  "status": "available",
  "location": "Namche Bazaar"
}
```

| Parameter  | Type   | Required | Description                                                      |
| ---------- | ------ | -------- | ---------------------------------------------------------------- |
| `name`     | string | ✅       | Name of help resource/team                                       |
| `contact`  | string | ✅       | Contact information                                              |
| `eta`      | string | ❌       | Estimated time of arrival                                        |
| `status`   | string | ❌       | Status: `available`, `dispatched`, `busy` (default: `available`) |
| `location` | string | ❌       | Current location                                                 |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "HID": 1,
    "name": "Nepal Army Rescue Team",
    "contact": "+977-1-4412345",
    "eta": "30 minutes",
    "status": "available",
    "location": "Namche Bazaar"
  },
  "message": "Help resource created successfully"
}
```

---

### GET `/Read/helps.php`

Retrieves help resource(s).

**Query Parameters:**

| Parameter | Type    | Required | Description                              |
| --------- | ------- | -------- | ---------------------------------------- |
| `id`      | integer | ❌       | Get specific help resource by HID        |
| `status`  | string  | ❌       | Filter by status                         |
| `search`  | string  | ❌       | Search by name or location               |
| `page`    | integer | ❌       | Page number (default: 1)                 |
| `limit`   | integer | ❌       | Results per page (default: 50, max: 100) |

**Examples:**

- Get all help resources: `GET /Read/helps.php`
- Get specific resource: `GET /Read/helps.php?id=1`
- Filter by status: `GET /Read/helps.php?status=available`
- Search: `GET /Read/helps.php?search=Army`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "helps": [
      {
        "HID": 1,
        "name": "Nepal Army Rescue Team",
        "contact": "+977-1-4412345",
        "eta": "30 minutes",
        "status": "available",
        "location": "Namche Bazaar"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 10,
      "pages": 1
    }
  },
  "message": "Help resources retrieved successfully"
}
```

---

### PUT `/Update/helps.php`

Updates an existing help resource.

**Request Body:**

```json
{
  "HID": 1,
  "name": "Nepal Army Rescue Team Alpha",
  "contact": "+977-1-4412346",
  "eta": "15 minutes",
  "status": "dispatched",
  "location": "En route to Lukla"
}
```

| Parameter  | Type    | Required | Description                                       |
| ---------- | ------- | -------- | ------------------------------------------------- |
| `HID`      | integer | ✅       | Help resource ID to update                        |
| `name`     | string  | ❌       | Updated name                                      |
| `contact`  | string  | ❌       | Updated contact                                   |
| `eta`      | string  | ❌       | Updated ETA                                       |
| `status`   | string  | ❌       | Updated status: `available`, `dispatched`, `busy` |
| `location` | string  | ❌       | Updated location                                  |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "HID": 1,
    "name": "Nepal Army Rescue Team Alpha",
    "contact": "+977-1-4412346",
    "eta": "15 minutes",
    "status": "dispatched",
    "location": "En route to Lukla"
  },
  "message": "Help resource updated successfully"
}
```

---

### DELETE `/Delete/helps.php`

Deletes a help resource.

**Query Parameters:**

| Parameter | Type    | Required | Description                |
| --------- | ------- | -------- | -------------------------- |
| `id`      | integer | ✅       | Help resource ID to delete |

**Example:** `DELETE /Delete/helps.php?id=1`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "deleted_id": 1,
    "name": "Nepal Army Rescue Team"
  },
  "message": "Help resource deleted successfully"
}
```

---

## Index Mappings

Index mappings decode LoRa integer codes into human-readable values.

**Available Types:**

- `location` - Maps location codes to village names
- `message` - Maps message codes to emergency types
- `help` - Maps help resource codes
- `status` - Maps status codes

### POST `/Create/index.php`

Creates a new index mapping.

**Request Body:**

```json
{
  "type": "location",
  "mapping": {
    "1": "Namche Bazaar",
    "2": "Lukla Village",
    "3": "Tengboche"
  },
  "description": "Maps location codes to village names in Solukhumbu region"
}
```

| Parameter     | Type   | Required | Description                                           |
| ------------- | ------ | -------- | ----------------------------------------------------- |
| `type`        | string | ✅       | Mapping type: `location`, `message`, `help`, `status` |
| `mapping`     | object | ✅       | JSON object mapping integer codes to string values    |
| `description` | string | ❌       | Description of this mapping                           |

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "IID": 1,
    "type": "location",
    "mapping": {
      "1": "Namche Bazaar",
      "2": "Lukla Village",
      "3": "Tengboche"
    },
    "description": "Maps location codes to village names in Solukhumbu region",
    "updated_at": "2026-01-21 12:00:00"
  },
  "message": "Index mapping created successfully"
}
```

**Error Response (409):**

```json
{
  "success": false,
  "data": null,
  "message": "Index mapping for this type already exists. Use update instead."
}
```

---

### GET `/Read/index.php`

Retrieves index mapping(s).

**Query Parameters:**

| Parameter | Type    | Required | Description                                        |
| --------- | ------- | -------- | -------------------------------------------------- |
| `id`      | integer | ❌       | Get by IID                                         |
| `type`    | string  | ❌       | Get by type                                        |
| `decode`  | string  | ❌       | Set to `true` for decode mode                      |
| `code`    | string  | ❌       | Code to decode (requires `decode=true` and `type`) |

**Examples:**

- Get all mappings: `GET /Read/index.php`
- Get by type: `GET /Read/index.php?type=location`
- Decode a code: `GET /Read/index.php?decode=true&type=message&code=1`

**Success Response (200) - Single Mapping:**

```json
{
  "success": true,
  "data": {
    "IID": 1,
    "type": "location",
    "mapping": {
      "1": "Namche Bazaar",
      "2": "Lukla Village"
    },
    "description": "Maps location codes to village names",
    "updated_at": "2026-01-21 12:00:00"
  },
  "message": "Index mapping retrieved successfully"
}
```

**Success Response (200) - Decode Mode:**

```json
{
  "success": true,
  "data": {
    "type": "message",
    "code": "1",
    "value": "Medical Emergency - Altitude Sickness"
  },
  "message": "Code decoded successfully"
}
```

---

### PUT `/Update/index.php`

Updates an existing index mapping. Supports three modes:

1. **Replace** - Replace entire mapping
2. **Add** - Add/update specific codes
3. **Remove** - Remove specific codes

**Request Body Options:**

**Mode 1: Replace entire mapping**

```json
{
  "type": "location",
  "mapping": {
    "1": "New Location 1",
    "2": "New Location 2"
  }
}
```

**Mode 2: Add/update specific codes**

```json
{
  "type": "location",
  "add": {
    "16": "New Village",
    "17": "Another Village"
  }
}
```

**Mode 3: Remove specific codes**

```json
{
  "type": "location",
  "remove": ["15", "16"]
}
```

| Parameter       | Type           | Required | Description                              |
| --------------- | -------------- | -------- | ---------------------------------------- |
| `IID` or `type` | integer/string | ✅       | Identifier for the index                 |
| `mapping`       | object         | ❌       | Complete new mapping (replaces existing) |
| `add`           | object         | ❌       | Codes to add/update                      |
| `remove`        | array          | ❌       | Array of codes to remove                 |
| `description`   | string         | ❌       | Updated description                      |

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "IID": 1,
    "type": "location",
    "mapping": { ... },
    "description": "Updated description",
    "updated_at": "2026-01-21 12:00:00"
  },
  "message": "Index mapping updated successfully"
}
```

---

### DELETE `/Delete/index.php`

Deletes an index mapping.

**Query Parameters:**

| Parameter | Type    | Required | Description        |
| --------- | ------- | -------- | ------------------ |
| `id`      | integer | ❌       | Index ID to delete |
| `type`    | string  | ❌       | Type to delete     |

> ⚠️ **One of `id` or `type` is required**

**Examples:**

- Delete by ID: `DELETE /Delete/index.php?id=1`
- Delete by type: `DELETE /Delete/index.php?type=location`

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "deleted_id": 1,
    "type": "location",
    "warning": "Index mapping deleted. Any messages/devices using this mapping will no longer decode properly."
  },
  "message": "Index mapping deleted successfully"
}
```

> ⚠️ **Warning:** Deleting an index mapping will break message/location decoding for existing data.

---

## Pre-defined Index Mappings

### Location Codes

| Code | Location      |
| ---- | ------------- |
| 1    | Namche Bazaar |
| 2    | Lukla Village |
| 3    | Tengboche     |
| 4    | Dingboche     |
| 5    | Gorak Shep    |
| 6    | Phakding      |
| 7    | Khumjung      |
| 8    | Pangboche     |
| 9    | Pheriche      |
| 10   | Lobuche       |
| 11   | Syangboche    |
| 12   | Thame         |
| 13   | Gokyo         |
| 14   | Machermo      |
| 15   | Chhukung      |

### Message Codes

| Code | Emergency Type                        |
| ---- | ------------------------------------- |
| 1    | Medical Emergency - Altitude Sickness |
| 2    | Medical Emergency - Injury            |
| 3    | Medical Emergency - Illness           |
| 4    | Search and Rescue Required            |
| 5    | Avalanche Alert                       |
| 6    | Landslide Warning                     |
| 7    | Fire Emergency                        |
| 8    | Flood Warning                         |
| 9    | Lost/Missing Person                   |
| 10   | Equipment Failure                     |
| 11   | Weather Emergency                     |
| 12   | Infrastructure Damage                 |
| 13   | Food/Water Shortage                   |
| 14   | Communication Lost                    |
| 15   | All Clear - Situation Normal          |

---

## Error Handling

All error responses follow the standard format:

```json
{
  "success": false,
  "data": null,
  "message": "Error description",
  "timestamp": "2026-01-21 12:00:00"
}
```

### Common Errors

| Status | Message                       | Cause                            |
| ------ | ----------------------------- | -------------------------------- |
| 400    | Missing required fields: X, Y | Required parameters not provided |
| 400    | Invalid status                | Status value not in allowed list |
| 401    | Not authenticated             | Session expired or not logged in |
| 401    | Invalid email or password     | Wrong credentials                |
| 404    | X not found                   | Resource doesn't exist           |
| 405    | Method not allowed            | Wrong HTTP method used           |
| 409    | Already exists                | Trying to create duplicate       |
| 500    | Database error                | Server/database issue            |

---

## CORS Support

All endpoints support CORS with the following headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

_LifeLine Emergency Response System - Team Spark | Global School of Science Hackathon_
