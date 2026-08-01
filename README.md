# 🛡️ TEAM_TECH – AI Email Security & Static Sandbox Analysis Platform

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-success)
![React](https://img.shields.io/badge/React-Frontend-61DAFB)
![SQLite](https://img.shields.io/badge/SQLite-Database-blue)
![Chrome Extension](https://img.shields.io/badge/Manifest-V3-orange)
![License](https://img.shields.io/badge/License-MIT-green)

An AI-powered email security platform that detects phishing emails, performs static sandbox analysis of attachments, calculates explainable risk scores, and generates downloadable security reports.

---
# 📚 Project Documentation

Complete project documentation is available in the Google Drive folder below.

## 📂 Google Drive

🔗 [FOLDER_LINK](https://drive.google.com/drive/folders/1zgT0r8qd2n5yjau7iNKVn5OZZl1adU0-?usp=drive_link)

## 📌 Overview

TEAM_TECH combines multiple security engines into a single explainable platform:

- 🌐 React Web Dashboard
- ⚡ FastAPI Backend
- 🗄 SQLite Database
- 🧠 Explainable AI Risk Engine
- 📧 Email Parser
- 🔍 Phishing Detection Engine
- 📦 Static Sandbox Analysis
- 📄 PDF & JSON Report Generator
- 🧩 Chrome Extension (Manifest V3)

## 🎯 Problem Statement

Email remains the primary attack vector for phishing, credential theft, ransomware, and malware delivery. Traditional email filtering solutions often:

- Detect only known attacks
- Ignore explainable reasoning
- Lack attachment analysis
- Provide poor visualization
- Do not generate detailed reports

TEAM_TECH addresses these limitations with a unified, explainable detection and reporting pipeline.

---

## ✨ Features

### 📧 Email Analysis
- Upload `.eml` emails
- Email parsing, header analysis, URL extraction
- Attachment detection and metadata analysis

### 🎣 Phishing Detection
Detects urgency language, suspicious domains, fake senders, URL shorteners, credential harvesting, display name spoofing, reply-to mismatches, SPF/DKIM indicators, and embedded login forms.

### 📦 Static Sandbox Analysis
Performs SHA256 hashing, file entropy analysis, magic byte / MIME detection, embedded URL extraction, JavaScript detection, Office macro detection, executable detection, and archive inspection.

> ⚠️ No file execution occurs — analysis is fully static.

### 🧠 Explainable Risk Engine
Combines email and sandbox indicators to produce:
- Risk score (0–100) and risk level
- Attack path
- Executive summary
- Recommendations

### 📊 Dashboard
Real-time statistics (total scans, risk breakdown by level), recent scans, risk distribution, threat telemetry, and activity timeline.

### 📑 Reports
Each scan generates an executive summary, email metadata, threat indicators, attachment details, risk assessment, and recommendations. Exportable as **PDF** or **JSON**.

### 📚 Scan History
SQLite-backed history storing scan ID, sender, receiver, subject, risk score/level, scan time, and linked reports.

### ⚙️ Settings
System health, backend/database status, connection testing, and database export/import.

### 🧩 Browser Extension (Manifest V3)
Supports Chrome, Edge, and Brave. Can analyze the current Gmail email, upload `.eml` files or attachments, view risk analysis, and download reports — communicating directly with the FastAPI backend.

---

## 🏗 Architecture

```
                Gmail / Outlook
                       │
                Chrome Extension
                       │
                       ▼
             FastAPI Backend API
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
 Email Parser    Phishing Engine   Sandbox Engine
        │              │              │
        └──────────────┼──────────────┘
                       ▼
               Explainable Risk Engine
                       │
                       ▼
                  SQLite Database
                       │
                       ▼
               React Dashboard UI
```

---

## 🛠 Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS, React Router, Recharts |
| **Backend** | FastAPI, Python, SQLAlchemy, Pydantic, ReportLab |
| **Database** | SQLite |
| **Browser Extension** | Manifest V3, Chrome Identity API, Gmail API, Chrome Storage, Chrome Notifications |

---

## 📁 Project Structure

```
TEAM_TECH/
├── backend/
│   ├── app/
│   ├── database/
│   ├── routes/
│   ├── services/
│   └── schemas/
├── frontend/
│   ├── src/
│   └── public/
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   ├── background.js
│   ├── content.js
│   ├── services/
│   └── utils/
├── scratch/
└── README.md
```

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/dinesh2007m/TEAM_TECH.git
cd TEAM_TECH
```

### 2. Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

Start the backend:

```bash
python -m uvicorn app.main:app --reload
```

- Backend: `http://127.0.0.1:8000`
- Swagger docs: `http://127.0.0.1:8000/docs`

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:3000` or `http://localhost:5173`

### 4. Chrome extension setup

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the `TEAM_TECH/extension` folder

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/upload/email` | Upload an email file |
| `POST` | `/api/v1/scan` | Run a complete scan |
| `POST` | `/api/v1/phishing/analyze` | Run phishing analysis |
| `POST` | `/api/v1/sandbox/analyze` | Run sandbox analysis |
| `POST` | `/api/v1/risk/analyze` | Run risk analysis |
| `GET` | `/api/v1/history` | Get scan history |
| `GET` | `/api/v1/report/{scan_id}` | Get a report |
| `GET` | `/api/v1/report/{scan_id}/pdf` | Download report as PDF |
| `GET` | `/api/v1/report/{scan_id}/json` | Download report as JSON |
| `GET` | `/api/v1/system/status` | Get system status |

---

## 📊 Risk Levels

| Score | Level |
|---|---|
| 0–20 | Safe |
| 21–50 | Low |
| 51–75 | Medium |
| 76–90 | High |
| 91–100 | Critical |

---

## 🔒 Security

- Never executes uploaded files — static sandbox inspection only
- Never stores passwords, cookies, or OAuth tokens
- Uses local SQLite storage
- Supports explainable AI decisions

---

## 🧪 Testing

Verified modules: email upload, email parsing, phishing detection, sandbox analysis, risk engine, SQLite persistence, dashboard, reports, history, PDF export, JSON export, browser extension, and Gmail OAuth integration.

---

## 📈 Future Enhancements

- Microsoft Graph API & IMAP integration
- AI-based URL classification
- VirusTotal integration
- YARA rule engine
- Dynamic sandbox analysis
- Machine learning–based detection
- Threat intelligence feeds
- Email quarantine
- Multi-user authentication
- Cloud deployment & Docker support

---

## 👨‍💻 Team

**TEAM_TECH**

Dakshnesh  —  Roll No: 7376252AD140 
Sethukkarasi  —  Roll No: 7376252IT332 
Dinesh M  —  Roll No: 7376242AL120 
Visvanth R  —  Roll No: 7376242AL221

---


## ⭐ Support

If you find this project useful, please consider giving it a ⭐ on GitHub.

## 🙏 Acknowledgements

FastAPI · React · SQLite · ReportLab · Google Gmail API · Chrome Extension Platform · Python Community
