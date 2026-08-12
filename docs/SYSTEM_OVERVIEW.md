# Architecture Overview

The AI Voice Training Platform follows a modern, cloud-native, microservices-oriented architecture designed for scalability, security, and real-time performance.

## High-Level Diagram

The system consists of three main logical blocks:

1.  **Frontend (Client):** A React-based Single Page Application (SPA).
2.  **Backend (API):** A Node.js/Fastify API server.
3.  **Real-time Edge:** LiveKit services for handling WebRTC audio/video streams.

## Key Components

### 1. Frontend (`aisales-frontend`)
*   **Framework:** React Router v7.
*   **Build Tool:** Vite.
*   **Styling:** Tailwind CSS.
*   **Responsibility:** Handles UI rendering, user interaction, audio capture, and displaying results.

### 2. Backend (`aisales-backend`)
*   **Runtime:** Node.js.
*   **Framework:** Fastify (chosen for low overhead and high performance).
*   **Database:** MongoDB (Mongoose ODM) for flexible document storage.
*   **AI Orchestration:** LangChain for managing LLM interactions.
*   **Responsibility:** Business logic, user management, session storage, and prompting the LLMs.

### 3. LiveKit Service (`livekit-service`)
*   **Language:** Python.
*   **Role:** Acts as the "AI Agent" that joins the voice call.
*   **Responsibility:** Receives audio from the user, performs Speech-to-Text (STT), sends text to the LLM, receives the response, and performs Text-to-Speech (TTS) to send audio back to the user.

## Data Flow

1.  **User** initiates a session on the **Frontend**.
2.  **Frontend** requests an access token from the **Backend**.
3.  **Frontend** connects to the **LiveKit Server** using the token.
4.  **LiveKit Service** (Python agent) joins the room.
5.  **Conversation Loop:**
    *   User speaks -> LiveKit STT -> Text.
    *   Text -> LLM (OpenAI/Anthropic) -> AI Response.
    *   AI Response -> 11Labs TTS -> Audio.
    *   Audio -> User hears response.
6.  **Completion:** Session data is saved to **MongoDB** via the **Backend**.
