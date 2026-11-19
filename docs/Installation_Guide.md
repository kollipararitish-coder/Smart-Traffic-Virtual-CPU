# Installation & Setup Guide (Windows 10 / 11)

This guide provides simple instructions for running the **Smart Traffic Signal Controller Using an Instruction-Level Virtual CPU** on Windows 10 and 11.

---

## 1. Prerequisites

Before running the application, ensure you have:
1. **Operating System**: Windows 10 or Windows 11 (64-bit)
2. **Node.js**: Version 24 or higher (tested with Node 24.22.1).
   - Check by opening PowerShell or Command Prompt:
     ```cmd
     node -v
     ```
   - If not installed, download from: [https://nodejs.org/](https://nodejs.org/)

---

## 2. Quick One-Click Setup (Recommended)

1. **Extract ZIP Archive**:
   Extract `Smart-Traffic-Virtual-CPU.zip` to your desired folder (e.g. Desktop).
2. **Open Project Folder**:
   Navigate into `smart-traffic-virtual-cpu/`.
3. **Run Install Script**:
   Double-click `scripts\install.bat`.
   - The script checks Node.js and npm.
   - Installs backend dependencies.
   - Installs frontend dependencies.
   - Executes the automated test suite to verify system integrity.
4. **Run Start Script**:
   Double-click `scripts\start.bat`.
   - Launches the Express backend server (`http://localhost:5000`).
   - Launches the Vite React frontend dashboard (`http://localhost:5174`).
   - Automatically opens your default web browser to the dashboard.

---

## 3. Manual Installation (Command Line Option)

If you prefer running commands manually via Command Prompt or PowerShell:

### Step 1: Install Backend
```cmd
cd backend
npm ci
npm test
```

### Step 2: Install Frontend
```cmd
cd ..\frontend
npm ci
npm run build
```

### Step 3: Start Services
- In terminal 1 (Backend):
  ```cmd
  cd backend
  npm start
  ```
- In terminal 2 (Frontend):
  ```cmd
  cd frontend
  npm run dev
  ```
- Open browser: `http://localhost:5174`

---

## 4. Troubleshooting

- **PowerShell Script Policy Warning (`PSSecurityException`)**:
  If npm commands give execution policy errors in PowerShell, execute batch scripts via Command Prompt (`cmd.exe`) or invoke `npm.cmd` instead of `npm`.
- **Port 5000 / 5174 in use**:
  Ensure no previous instance is running. You can check running processes using Task Manager or `netstat -ano | findstr :5000`.


## Cross-platform commands (run from extracted project root)

Requires Node.js 24 or newer and npm. Dependencies need internet on first installation.

```bash
npm run install:all
npm test
npm run build:frontend
npm run start:backend
```

Then open http://localhost:5000. The backend serves the built dashboard, REST API and Socket.IO from the same origin. No Vite terminal is needed for this mode. For development, run `npm run start:frontend` in a second terminal and use http://localhost:5174. The backend binds to 127.0.0.1. The Windows scripts are included but were not executed on Windows in this review.

The ZIP intentionally excludes node_modules, SQLite session files and temporary test artifacts. It includes the compiled dashboard. Rebuild the dashboard after frontend source changes.
