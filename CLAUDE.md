# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

G-Comics is a React-based comic book reader and management system built with Vite, TypeScript, and the Gemini AI API. The app allows users to browse comics in grid/list views, read them in a full-screen reader, and admin users can upload and manage comics with AI-generated descriptions.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm preview
```

## Environment Setup

Create a `.env.local` file in the root with:
```
GEMINI_API_KEY=your_api_key_here
```

The Gemini API key is used for AI-generated comic descriptions in the admin interface.

## Architecture

### State Management & Data Flow

- **LocalStorage-based persistence**: All comics and user sessions are stored in browser localStorage
- **Polling mechanism**: App polls localStorage every 2 seconds (App.tsx:31-35) to sync changes made in the Admin panel
- **No backend**: Entirely client-side application using HashRouter for GitHub Pages compatibility

### Core Data Models (types.ts)

- `Comic`: Contains id, title, description, coverUrl, pages[] (image URLs), author, createdAt
- `User`: Simple auth model with id, name, email, imageUrl
- `ViewMode`: Enum for GRID/LIST toggle

### Routing Structure (App.tsx)

- `/` - Home page (comic grid/list view)
- `/admin` - Admin panel for managing comics (requires Google mock login)
- `/read/:id` - Full-screen comic reader (standalone layout without header)

The Reader route uses a separate layout without the standard Header component, while all other routes share the Header.

### Key Services

**storageService.ts**:
- Manages all localStorage operations for comics and user sessions
- Seeds initial mock comics data (INITIAL_COMICS from constants.ts) on first load
- Provides `loginWithGoogleMock()` which simulates a 1.5s network delay

**geminiService.ts**:
- Integrates with Google Gemini AI API (`@google/genai`)
- Uses `gemini-3-flash-preview` model
- Generates short marketing-style descriptions for comics based on title and author

### Image Handling

- Comic covers and pages use base64 or external URLs
- FileUpload component (components/FileUpload.tsx) converts uploaded images to base64
- Initial mock data uses picsum.photos placeholders

### Authentication

Mock Google login flow (no real OAuth):
- Login simulated with 1.5s delay in `storageService.ts:44-58`
- Session stored in localStorage under `g_comics_user_session`
- Only authenticated users can access Admin panel features

## Important Implementation Details

- Vite config exposes `GEMINI_API_KEY` via `process.env.API_KEY` and `process.env.GEMINI_API_KEY` (vite.config.ts:14-15)
- HashRouter is used instead of BrowserRouter (likely for GitHub Pages deployment)
- The app uses Tailwind-style utility classes but no explicit Tailwind config is present
- React 19.2.3 is used with latest concurrent features
