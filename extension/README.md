# TEAM_TECH – Browser Extension (Manifest V3)

> AI Email Phishing Detection & Static Sandbox Analysis Platform Browser Extension

## Supported Browsers
- **Google Chrome** (Manifest V3)
- **Microsoft Edge** (Manifest V3)
- **Brave Browser** (Manifest V3)

---

## Extension Architecture

The TEAM_TECH Browser Extension acts as a client interface to the existing TEAM_TECH FastAPI backend. All AI phishing detection, static sandbox file analysis, risk calculation, and SQLite persistence are performed by the backend server.

### Folder Structure
```text
extension/
├── manifest.json            # Manifest V3 extension configuration
├── popup.html               # Popup interface structure
├── popup.css                # AEGISX Cyber Dark Theme styling
├── popup.js                 # Popup UI logic & event handling
├── background.js            # Service worker for API orchestration & notifications
├── content.js               # Read-only Gmail & Outlook DOM extraction script
├── utils/
│   ├── api.js               # API client layer connecting to FastAPI endpoints
│   ├── storage.js           # Extension settings storage manager
│   └── notifications.js     # Desktop notifications & extension badge manager
├── icons/                   # Extension icons (16px, 48px, 128px)
└── README.md                # Installation and developer guide
```

---

## Features

1. **Webmail DOM Extraction**:
   - Safely extracts visible email metadata (sender, receiver, subject, body text, links, attachments) from currently active Gmail (`https://mail.google.com`) or Outlook (`https://outlook.office.com`, `https://outlook.live.com`).
   - Read-only DOM parsing — zero credentials, cookies, or auth tokens accessed.

2. **Manual Email & File Upload**:
   - `.eml` / `.msg` full email parsing and complete scan trigger via `/api/v1/scan`.
   - Attachment file upload (PDF, Executable, Office macro, Archive) for static sandbox analysis via `/api/v1/sandbox/analyze`.

3. **Risk Gauge & Threat Indicators**:
   - Real-time risk level badge (`HIGH`, `MEDIUM`, `LOW`, `SAFE`), score out of 100, recommendation, and list of threat indicators.

4. **Direct PDF & JSON Export**:
   - Download official PDF audit reports (`/api/v1/report/{scan_id}/pdf`) and raw JSON records directly from popup.

5. **Auto-Analyze Setting**:
   - Automatically detects and analyzes opened emails when switching tabs in Gmail or Outlook.

6. **SQLite History Sync**:
   - Browse all past scan records directly inside the popup history tab.

---

## Installation Guide

### How to Load Unpacked in Chrome / Edge / Brave

1. **Ensure Backend is Running**:
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```
   Verify backend status at `http://127.0.0.1:8000/api/v1/system/status`.

2. **Open Extensions Page**:
   - Chrome / Brave: Navigate to `chrome://extensions/`
   - Microsoft Edge: Navigate to `edge://extensions/`

3. **Enable Developer Mode**:
   - Toggle the **Developer mode** switch in the top right corner.

4. **Load Unpacked Extension**:
   - Click **Load unpacked**.
   - Select the `extension/` directory inside `TEAM_TECH/extension/`.

5. **Pin Extension**:
   - Pin the **TEAM_TECH** extension icon to your browser toolbar.

---

## Backend API Endpoints Utilized

| Endpoint | Method | Description |
|---|---|---|
| `/api/v1/upload/email` | POST | Uploads & parses .eml file |
| `/api/v1/phishing/analyze` | POST | Rule-based & AI phishing detection |
| `/api/v1/sandbox/analyze` | POST | Static sandbox file inspection |
| `/api/v1/risk/analyze` | POST | Unified risk scoring & attack path generation |
| `/api/v1/scan` | POST | 1-click complete scan & SQLite auto-save |
| `/api/v1/history` | GET | List scan records from database |
| `/api/v1/report/{scan_id}` | GET | Retrieve full scan details |
| `/api/v1/report/{scan_id}/pdf` | GET | Download binary PDF audit report |
| `/api/v1/report/{scan_id}/json` | GET | Download raw JSON audit report |
| `/api/v1/system/status` | GET | Backend health & database status |

---

## Security & Compliance

- **No Credentials Stored**: Password inputs, cookies, session tokens, and headers are strictly ignored.
- **Single Origin Target**: Network requests are exclusively restricted to `http://127.0.0.1:8000` (or user-configured server URL).
- **Safe Execution**: Uploaded files are inspected statically without code execution.
