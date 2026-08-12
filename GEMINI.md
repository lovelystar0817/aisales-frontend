# AI Voice Training Platform - Project Overview

## 🚀 Project Summary
This repository houses an enterprise-grade **AI Voice Training Platform** designed for sales training, compliance, and customer support scenarios. It features real-time voice interaction, AI-powered assessment, and strict security controls (PII masking, zero-retention).

## 📂 Project Structure

The project is a monorepo containing several distinct applications and services:

*   **`aisales-backend/`**: The core API server (Node.js/Fastify). Handles business logic, auth, and AI orchestration.
*   **`aisales-frontend/`**: The main web application (React Router). The user interface for trainees and admins.
*   **`aisales-backend/livekit-service/`**: A Python-based service for handling real-time AI voice agents via LiveKit.
*   **`hupo-customer-dashboard/`**: A Next.js dashboard application (Next.js 15).
*   **`traffic-light-dashboard/`**: Another Next.js dashboard application (Next.js 14).

## 🛠️ Development & Usage

### 1. Backend (`aisales-backend`)

**Tech Stack:** Node.js, Fastify, TypeScript, MongoDB, Auth0, LangChain.

*   **Setup:** `npm install` then copy `.env.example` to `.env.local`.
*   **Run Dev:** `npm run dev` (starts server with hot reload).
*   **Build:** `npm run build` (outputs to `dist/`).
*   **Test:** `npm run test`.
*   **Lint/Format:** `npm run lint` / `npm run format`.
*   **Key Directories:**
    *   `src/routes/`: API endpoints (Fastify plugins).
    *   `src/prompts/`: AI prompts and logic.
    *   `src/models/`: Mongoose schemas.

### 2. Frontend (`aisales-frontend`)

**Tech Stack:** React, React Router, Vite, Tailwind CSS, Auth0.

*   **Setup:** `npm install`.
*   **Run Dev:** `npm run dev` (runs on port 5173).
*   **Build:** `npm run build`.
*   **Preview:** `npm run start`.

### 3. LiveKit Service (`aisales-backend/livekit-service`)

**Tech Stack:** Python, Docker, LiveKit.

*   **Setup:** Requires Docker and Docker Compose V2.
*   **Configuration:** Copy `.env.template` to `.env`.
*   **Deploy/Run:** `./deploy.sh` (handles build and start).
*   **Logs:** `docker compose logs -f`.

### 4. Dashboards

*   **Hupo Customer Dashboard:** `cd hupo-customer-dashboard` -> `npm run dev` (Next.js).
*   **Traffic Light Dashboard:** `cd traffic-light-dashboard` -> `npm run dev` (Next.js).

## 📚 Documentation

The root directory contains extensive architecture and security documentation:

*   **`ai-voice-training-architecture.md`**: Detailed system architecture.
*   **`security-controls-implementation.md`**: Security and compliance guide.
*   **`README.md`**: Comprehensive system overview.

## 📝 Conventions

*   **TypeScript:** Used extensively across backend and frontend.
*   **ES Modules:** The backend uses ES modules (`.js` extension in imports, `"type": "module"` in `package.json`).
*   **Formatting:** Prettier is used for code formatting.
*   **Environment Variables:** Managed via `.env` files (use templates provided).
*   **Security:** Strict adherence to security protocols (PII redaction, etc.) is mandatory.
