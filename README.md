📱 Static Analysis Framework UI

A modern React + Node.js UI that securely interacts with Mobile Security Framework (MobSF) for Android app static analysis.

✔ Secure proxy — MobSF API key is stored only in backend
✔ Automatically caches JSON/PDF results
✔ One-click automation using batch scripts:

→ First-time installation & MobSF setup guide run the below command
command 1)
        .\setup.bat 
then run below command frontend + backend
command 2)
        .\start.bat 

🚀 Features
Feature	Status
APK Upload & Static Scan	✔
Live Scan Logs	✔
Security Score & Summary	✔
Detailed Findings	✔
Dangerous Permissions View	✔
Offline JSON/PDF Report Caching	✔
View/Download PDF Reports	✔
Recent Scans List	✔
Single-page Report View	✔
📦 Project Structure
mobsf-project/
├─ setup.bat                ← One-click installation
├─ start.bat                ← Start backend + frontend automatically
│
├─ mobsf-ui-backend/        ← Secure MobSF API proxy + caching
│  ├─ server.js
│  ├─ .env  (created during setup)
│  ├─ reports/
│  │   ├─ json/
│  │   └─ pdf/
│  └─ package.json
│
├─ mobsf-frontend/          ← React UI
│  ├─ src/
│  │  ├─ api.js
│  │  └─ components/
│  └─ package.json
│
└─ README.md

🧩 Requirements
Tool	Version
Node.js	18+
npm	Included with Node
Docker Desktop for Windows	Latest
MobSF Docker Image	Pulled via setup.bat
🛠 Initial Setup (run once)

Simply execute:

setup.bat


It will:

Check Node.js and npm

Install frontend + backend dependencies

Create reports folders automatically

Check Docker

Guide you to pull and run MobSF:

docker pull opensecurity/mobile-security-framework-mobsf:latest
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf:latest


Open MobSF → Settings → Security → Copy REST API key

Ask you to paste API key → auto-writes .env

No manual file editing needed.

▶ Run the Application

Whenever you want to use the tool:

start.bat


This automatically opens 2 terminals:

Service	URL
Backend	http://localhost:4000

Frontend	http://localhost:3000

Frontend will auto-open in browser.

🔄 How It Works
Step	Action
1️⃣	User uploads APK
2️⃣	Backend proxies upload to MobSF (secure, hidden API key)
3️⃣	Backend triggers scan
4️⃣	Frontend polls scan logs → live updates
5️⃣	Backend fetches & saves JSON/PDF to /reports
6️⃣	User views/downloads results offline

Reports stored at:

mobsf-ui-backend/reports/
├─ json/<hash>.json
└─ pdf/<hash>.pdf

🧰 API Endpoints (Proxy)
Method	Path	Description
POST	/api/upload	Upload APK/IPA
POST	/api/scan	Trigger scan
POST	/api/scan_logs	Poll scan status
GET	/api/report_json/save?hash=	Cache JSON
GET	/api/download_pdf/save?hash=	Cache PDF
GET	/api/reports	List cached scans
GET	/reports/json/<hash>	Open cached JSON
GET	/reports/pdf/<hash>	Open cached PDF
🧠 Troubleshooting
Issue	Fix
API key errors	Re-run setup.bat and update .env
Docker not running	Start Docker Desktop
Reports not showing	Ensure scan is fully completed
Port conflicts	Stop other apps using 3000 / 4000
🛡 Legal & Security Notice

Do not analyze apps without permission

Follow MobSF licensing and your organization’s security policy

This tool is for learning, internal testing, research only

🏁 Roadmap

JWT Authentication support

Theme (Light/Dark)

Multiple MobSF server connections

Better error visibility in UI

Upload file history export

🏷 License

This project is for educational & research use only.
MobSF copyright belongs to Mobile Security Framework.

