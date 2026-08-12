# Frontend Architecture

The frontend is a modern React application built for speed and interactivity.

## Routing

The app uses **React Router v7** with a config-based routing approach (`app/routes.ts`).

*   **Layouts:** Used to share UI elements like the sidebar and navigation headers.
*   **Loaders:** Data fetching happens in parallel with routing to prevent waterfalls.

## State Management

*   **Zustand:** A lightweight state management library used for global UI state (e.g., modal open/close, user preferences).
*   **React Query (TanStack Query):** Handles server state (fetching, caching, and synchronizing data with the backend).

## Real-time Communication

*   **LiveKit Client SDK:** The `livekit-client` library is used to manage the WebRTC connection.
*   **Audio Context:** The app manages browser audio permissions and device selection (mic/speaker).

## UI Components

*   **Tailwind CSS:** Utility-first CSS for rapid styling.
*   **Radix UI:** Headless UI primitives for accessible components (Dialogs, Popovers, Dropdowns).
*   **Lucide React:** Icon set.

## Internationalization (i18n)

The app is built to be multilingual (`i18next`), supporting dynamic language switching for global deployments.
