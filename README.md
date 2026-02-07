# FNOL Claims Processing Project

This project helps automate the early stages of insurance claims. It reads FNOL (First Notice of Loss) documents like PDF or TXT files, extracts the important details, and decides where the claim should go.

## How it works

1. It extracts text from the uploaded file.
2. It looks for things like policy number, name, date, description, and damage amount.
3. It validates if any mandatory information is missing.
4. It uses business rules to route the claim:
   - Fast-Track: If damage is less than 25,000.
   - Manual Review: If something important is missing.
   - Investigation: If keywords like "fraud" or "staged" are found.
   - Specialist: If there are injuries involved.

## Steps to run the project

You need to run both the backend and the frontend separately.

### 1. Setup
Go into each folder and install the packages:
- Open a terminal in the "backend" folder and run: npm install
- Open a terminal in the "frontend" folder and run: npm install

### 2. Run the Backend
In the "backend" terminal, run:
npm run dev

The backend will start on port 3001.

### 3. Run the Frontend
In the "frontend" terminal, run:
npm run dev

The frontend will start on port 3000. Now open http://localhost:3000 in your browser to use the app.
