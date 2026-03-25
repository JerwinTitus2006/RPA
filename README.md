# AI Resume Screening and Candidate Shortlisting

This document is the complete run guide for this project, especially after restarting your PC.

## Final Working Architecture

Current flow used by the app:

1. Frontend uploads PDF directly to published n8n webhook.
2. n8n parses/scores/shortlists using Ollama and workflow logic.
3. n8n writes to Google Sheet and sends shortlist email.
4. n8n returns candidate JSON response.
5. Frontend stores returned records locally and shows them in Dashboard.

Notes:
- Backend is still available but optional in this final mode.
- Dashboard currently shows records from local browser storage (`n8nDashboardCandidates`) populated by successful uploads.

## Project Structure

```text
rpa/
  backend/
  frontend/
    .env.example
    src/components/Upload.jsx
    src/components/Dashboard.jsx
  n8n/
    resume-screening-workflow.json
  resumes/
  README.md
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB (only required if you still run backend features)
- n8n installed and runnable
- Ollama installed locally
- Model pulled: `llama3.2:1b`
- Internet access for Google Apps Script and SMTP delivery

## One-Time Setup

Run once after cloning/opening project.

### 1. Install frontend dependencies

```powershell
cd c:\Users\Jerwin titus\Desktop\rpa\frontend
npm install
```

### 2. Install backend dependencies (optional but recommended)

```powershell
cd c:\Users\Jerwin titus\Desktop\rpa\backend
npm install
```

### 3. Create frontend env file

Create `frontend/.env` with:

```env
VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook/resume-upload
VITE_API_BASE_URL=http://localhost:5000
```

`VITE_N8N_WEBHOOK_URL` is used by Upload.
`VITE_API_BASE_URL` is kept for compatibility.

### 4. Create backend env file (optional)

Create `backend/.env` with:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ai_resume_screening
GEMINI_API_KEY=your_gemini_api_key_here
N8N_WEBHOOK_URL=http://localhost:5678/webhook/resume-upload
FRONTEND_URL=http://localhost:5173
```

### 5. Import and activate n8n workflow

1. Open n8n at `http://localhost:5678`
2. Import `n8n/resume-screening-workflow.json`
3. Save workflow
4. Toggle Active ON

Important:
- Test URL: `/webhook-test/resume-upload` works only after clicking Execute workflow.
- Production URL: `/webhook/resume-upload` works when workflow is Active.

## Complete Startup Steps After Restarting PC

Use this exact order every time.

## Exact Commands After Restart (Copy in Order)

Run these commands in separate terminals.

Terminal A (MongoDB, optional):

```powershell
Get-Service | Where-Object { $_.Name -match "Mongo" }
Start-Service MongoDB
```

Terminal B (Ollama):

```powershell
ollama serve
```

Terminal C (n8n):

```powershell
n8n start
```

Terminal D (Frontend):

```powershell
cd c:\Users\Jerwin titus\Desktop\rpa\frontend
npm run dev
```

Terminal E (Backend, optional):

```powershell
cd c:\Users\Jerwin titus\Desktop\rpa\backend
npm run dev
```

Quick verification commands:

```powershell
curl.exe -sS -I http://localhost:5173
curl.exe -sS http://localhost:5000/health
curl.exe -sS http://localhost:5678
```

Upload test command (published webhook):

```powershell
$filePath = "c:\Users\Jerwin titus\Desktop\rpa\resumes\Resume.pdf"
curl.exe -sS -X POST -F "file=@$filePath;type=application/pdf" "http://localhost:5678/webhook/resume-upload"
```

### Terminal 1: MongoDB (optional for current frontend+n8n mode)

```powershell
Get-Service | Where-Object { $_.Name -match "Mongo" }
Start-Service MongoDB
```

### Terminal 2: Ollama

```powershell
ollama serve
```

Open another quick check terminal:

```powershell
ollama list
```

If model missing:

```powershell
ollama pull llama3.2:1b
```

### Terminal 3: n8n

```powershell
n8n start
```

Then verify in browser:

1. Open `http://localhost:5678`
2. Workflow is present
3. Active toggle is ON

### Terminal 4: Frontend (required)

```powershell
cd c:\Users\Jerwin titus\Desktop\rpa\frontend
npm run dev
```

Open app:

- `http://localhost:5173`

### Terminal 5: Backend (optional)

Run only if you still need backend APIs.

```powershell
cd c:\Users\Jerwin titus\Desktop\rpa\backend
npm run dev
```

Health check:

```powershell
curl.exe -sS http://localhost:5000/health
```

## How to Run and Verify Entire Project

### A. Verify published n8n webhook directly

```powershell
$filePath = "c:\Users\Jerwin titus\Desktop\rpa\resumes\Resume.pdf"
curl.exe -sS -X POST -F "file=@$filePath;type=application/pdf" "http://localhost:5678/webhook/resume-upload"
```

Expected response includes candidate data, for example:

- `name`
- `email`
- `skills`
- `score`
- `status`
- `accepted` (SMTP accepted recipients)

### B. Verify from frontend UI

1. Open `http://localhost:5173`
2. Upload tab -> select PDF -> Upload
3. Wait for Completed
4. Open Dashboard tab
5. Candidate row should appear

### C. Verify external outputs

1. Google Sheet should receive row for shortlisted/rejected branch.
2. Email should arrive for shortlisted flow.

## Shortlisting Logic in n8n

Current logic:

1. Must-have skills checked against: Python, Machine Learning, SQL
2. Experience threshold: `>= 2`
3. Final score threshold: `>= 70`
4. If true -> Shortlisted
5. If false -> Rejected

## Daily Quick Start Commands (Copy-Paste)

```powershell
# 1) Optional database
Start-Service MongoDB

# 2) AI runtime (keep terminal open)
ollama serve

# 3) n8n (keep terminal open)
n8n start

# 4) frontend (keep terminal open)
cd c:\Users\Jerwin titus\Desktop\rpa\frontend
npm run dev

# 5) optional backend
cd c:\Users\Jerwin titus\Desktop\rpa\backend
npm run dev
```

## Stop Commands

To stop running services, in each terminal press `Ctrl + C`.

For MongoDB service:

```powershell
Stop-Service MongoDB
```

## Troubleshooting

### 1. Frontend upload fails

Checks:

1. `VITE_N8N_WEBHOOK_URL` is correct in `frontend/.env`
2. n8n is running
3. Workflow Active is ON
4. Ollama is running

### 2. Dashboard shows no candidates

Checks:

1. Upload was completed at least once
2. Browser local storage key exists: `n8nDashboardCandidates`
3. Hard refresh browser (`Ctrl + F5`)

### 3. Production webhook 404

Cause:

- Workflow not active in n8n runtime.

Fix:

1. Open n8n UI
2. Save workflow
3. Toggle Active ON
4. Retry `/webhook/resume-upload`

### 4. Only webhook-test works

Cause:

- Running in test execution mode only.

Fix:

- Use production webhook URL and active workflow.

### 5. Email not received

Checks:

1. Candidate actually shortlisted
2. SMTP credentials valid in n8n node
3. n8n execution logs show no SMTP error

### 6. Google Sheet not updated

Checks:

1. Apps Script URL is current and deployed as web app
2. Web app permissions allow access
3. n8n execution logs for HTTP response from script

## Security and Reliability Notes

1. Keep credentials in n8n credentials or env vars, not hardcoded.
2. Export workflow backup after major changes.
3. Keep 2-3 sample PDFs in `resumes/` for smoke tests after restarts.
4. Consider running long-term services with process managers for auto-start.
