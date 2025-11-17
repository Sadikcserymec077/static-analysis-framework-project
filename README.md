# 🛡️ Static Analysis Framework v2.0

> A modern, responsive web-based UI for **MobSF (Mobile Security Framework)** focused on **Android APK static analysis**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-19.2.0-blue)](https://reactjs.org/)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Configuration](#️-configuration)
- [Usage](#-usage)
- [Troubleshooting](#-troubleshooting)
- [Project Structure](#-project-structure)
- [Future Enhancements](#-future-enhancements)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Features

- 📱 **APK Analysis (MobSF)**  
  Upload and analyze Android APK files using MobSF via a secure Node.js proxy.

- 🔒 **Secure API Proxy**  
  MobSF API key is stored **only in the backend `.env` file**. It is **never exposed** to the browser.

- 📊 **Security Score & Summary View**  
  Custom `HumanReport` UI:
  - Security score (0–100) based on MobSF summary + dangerous permissions  
  - “Safe to Install / Install with Caution / Not Recommended” guidance  
  - Grouped findings by severity (High / Medium / Info) and category

- 📄 **Report Handling**
  - Auto-save JSON reports (`/reports/json/<hash>.json`)
  - Auto-save PDF reports (`/reports/pdf/<hash>.pdf`)
  - View PDF inline or download

- 📜 **Dangerous Permissions View**  
  Detects and lists dangerous permissions (camera, storage, SMS, etc.) with short descriptions.

- 🕒 **Scan Logs & Status**
  - Backend polls MobSF `scan_logs`
  - Frontend shows upload/scan progress and messages

- 📂 **Recent Scans / Reports Page**
  - Uses MobSF `/api/v1/scans` via `/api/scans` proxy  
  - **Reports tab** shows list of recently scanned APKs  
  - Clicking an item loads the full summary + PDF controls on the same page

- 🎨 **Modern UI**
  - React + React-Bootstrap layout
  - Gradient summary header card
  - Responsive grid (Upload / Reports / Summary)

---

## 🛠️ Tech Stack

### Frontend

- **React** 19.2.0
- **React Bootstrap** 2.10.10
- **Bootstrap 5.3.8** + **Bootstrap Icons**
- **Recharts** 3.3.0 (charts)
- **Axios** (HTTP client)

### Backend

- **Node.js** 18+
- **Express** 4.18.x
- **Axios** (calls MobSF APIs)
- **Multer** (file upload)
- **FormData**
- **cors**
- **dotenv**
- **fs / path** (report storage)

### External

- **MobSF** via Docker  
  Image: `opensecurity/mobile-security-framework-mobsf:latest`

> SonarQube and other extra tools are **not used** in this version. The focus is MobSF-only static analysis.

---

## 📦 Prerequisites

- **Node.js** ≥ 18 (includes npm)  
  Download: https://nodejs.org/

- **Docker Desktop** (for running MobSF container)  
  Download: https://www.docker.com/

- **Git** (optional, for cloning)  
  Download: https://git-scm.com/

### System Requirements

- RAM: **4 GB** minimum (8 GB recommended)
- Storage: **2 GB** free
- OS: **Windows 10/11** recommended  
  (Linux/macOS supported with manual steps)

---

## 🚀 Quick Start

### ✅ Windows – One-Time Setup

In the **project root** (where `setup.bat` is):
###
firts setup all the dependencies and api key
```bat
.\setup.bat 

### then run this command

.\start.bat
