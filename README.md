# AI Ecom Engine

A Next.js application for discovering, analyzing, and generating e-commerce ads using the Foreplay API and Google AI (Gemini).

## Prerequisites

- **Node.js** 18+ and npm

## Installation

1. **Navigate to the project directory:**
   ```bash
   cd "AI Ecom Engine"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

## Environment Setup

Create a `.env.local` file in the `AI Ecom Engine` directory with the following variables:

```env
FOREPLAY_API_KEY=your_foreplay_api_key_here
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### Getting API Keys

- **Foreplay API Key:** Sign up at [Foreplay](https://foreplay.co) and obtain your API key from the dashboard.
- **Google AI API Key:** Go to [Google AI Studio](https://aistudio.google.com/apikey) to create an API key for Gemini.

> ⚠️ **Important:** Never commit `.env.local` or share your API keys. The file is excluded from version control.

## Running the App

**Development mode (with Turbopack):**
```bash
npm run dev
```

**Production build:**
```bash
npm run build
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000) by default.
