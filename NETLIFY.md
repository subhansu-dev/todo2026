# Netlify Deployment Guide

This project is pre-configured and 100% Netlify-ready with support for:
- Static Single-Page Application (SPA) asset bundling (`dist/`)
- Client-side route fallback (`/*` -> `/index.html`) via `_redirects` and `netlify.toml`
- Netlify Serverless Functions (`netlify/functions/`) for Gemini AI chat & high-resolution image generation
- Automatic API proxying (`/api/*` -> `/.netlify/functions/*`)

---

## 🚀 Quick Deployment Options

### Option 1: Deploy with Netlify Git Integration (Recommended)
1. Push this repository to **GitHub**, **GitLab**, or **Bitbucket**.
2. Log into your [Netlify Dashboard](https://app.netlify.com).
3. Click **Add new site** > **Import an existing project**.
4. Select your repository. Netlify will automatically detect:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
   - **Functions directory:** `netlify/functions`
5. Click **Deploy Site**.

### Option 2: Deploy with Netlify CLI
```bash
npm install -g netlify-cli
netlify login
netlify deploy --build --prod
```

---

## 🔑 Setting Up Environment Variables on Netlify

To enable the Gemini AI Copilot and 1K/2K/4K Image Studio:

1. In your Netlify site dashboard, go to **Site configuration** > **Environment variables**.
2. Click **Add a variable** > **Add a single variable**.
3. Set:
   - **Key:** `GEMINI_API_KEY`
   - **Value:** `<Your Google Gemini API Key>`
4. Trigger a new deploy (or rebuild) for the environment variable to take effect.

---

## 📁 Key Netlify Files Included

- `netlify.toml`: Configuration for build command, functions bundler, headers, and redirects.
- `public/_redirects`: Built-in fallback routing rules copied directly to `dist/`.
- `netlify/functions/chat.ts`: Serverless endpoint for Gemini multi-turn AI chatbot.
- `netlify/functions/generate-image.ts`: Serverless endpoint for high-resolution image generation (`gemini-3-pro-image-preview`).
- `netlify/functions/health.ts`: Health-check endpoint for serverless deployment validation.
