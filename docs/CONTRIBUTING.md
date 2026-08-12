# Contributing

We welcome contributions to the AI Voice Training Platform! This guide will help you set up your development environment.

## Prerequisites

*   **Node.js:** v20 or higher.
*   **Docker:** Required for running local services like MongoDB and LiveKit.
*   **Python:** v3.10+ (for the LiveKit agent).

## Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd ai-sales
    ```

2.  **Install Dependencies:**
    ```bash
    # Backend
    cd aisales-backend
    npm install

    # Frontend
    cd ../aisales-frontend
    npm install
    ```

3.  **Environment Variables:**
    *   Copy `.env.example` to `.env.local` in both backend and frontend directories.
    *   Populate the required API keys (Auth0, OpenAI, LiveKit, MongoDB).

## Running Locally

### 1. Start Infrastructure
Use the provided docker-compose file (if available) or run MongoDB locally.

### 2. Start Backend
```bash
cd aisales-backend
npm run dev
```

### 3. Start Frontend
```bash
cd aisales-frontend
npm run dev
```

### 4. Start LiveKit Service
```bash
cd aisales-backend/livekit-service
./deploy.sh
```

## Code Style

*   **Formatting:** We use **Prettier**. Run `npm run format` before committing.
*   **Linting:** We use **ESLint**. Run `npm run lint` to check for issues.
*   **Commits:** Please write clear, descriptive commit messages.

## Testing

*   **Backend:** Run `npm run test` (Vitest).
*   **Frontend:** Run `npm run typecheck` to ensure type safety.

## Pull Requests

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.
