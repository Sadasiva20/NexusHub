# NexusHub: Collaborative Developer Platform

## Project Description

A modern, real-time collaborative development environment for developers to work together on various projects. Inspired by Figma and Google Docs, this tool enables multiple developers and content creators to collaborate, preview changes live, and leverage AI-powered optimizations. It includes integrated support for building and managing Storyblok component schemas as a key feature.

## Goals

- Enable real-time, multi-user editing of component schemas.
- Provide live preview of schema changes in a simulated front-end.
- Integrate with Storyblok Management API for seamless import/export and syncing.
- Offer AI-powered suggestions for schema design and documentation.
- Support versioning, rollback, and environment management (local/cloud).
- Deliver an intuitive, accessible UI with dark mode and responsive design.

## Technologies Used

- **Frontend:** Next.js, React, Tailwind CSS
- **Realtime Collaboration:** Socket.IO (Node.js server)
- **Backend/API:** Next.js API routes, Node.js, Storyblok Management API
- **State Management:** React hooks (expandable to Zustand/Redux)
- **AI Integration:** Vercel AI SDK with Google Gemini 2.5 Pro for schema suggestions
- **Other:** TypeScript, ESLint, PostCSS, Vercel (hosting), Railway/Render (Socket.IO server)

## Features

### Core Features (MVP)

- Real-time collaborative JSON schema editor
- Live updates between users via Socket.IO
- Basic Storyblok API integration for CRUD operations
- Simple, modern UI with Tailwind CSS
- AI-powered schema suggestions using Vercel AI SDK
- Live preview panel for component rendering
- Schema validation and error highlighting
- Component list management and selection
- Undo/redo and local snapshots

### Intermediate Features (Planned/Partial)

- Versioning and rollback for schemas
- Authentication (GitHub, anonymous sessions)

### Advanced Features (Future)

- Full AI schema assistant (natural language to schema)
- React Native live preview
- VSCode extension and Storyblok plugin integration

## Project Structure

```
nexushub/
├── public/                # Static assets (SVGs, icons)
├── components/            # React components (Interface, Feature, Grid, etc.)
├── pages/                 # Next.js pages and API routes
│   ├── api/               # Next.js API routes
│   ├── ai.js          # Google Gemini API integration for schema suggestions
│   │   └── storyblok.js   # Storyblok Management API integration
│   ├── _app.js            # Next.js app component
│   └── index.js           # Main application page
├── socket/                # Socket.IO server for real-time collaboration
├── styles/                # Global CSS styles
├── README.md              # Project documentation
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── eslint.config.mjs      # ESLint configuration
├── postcss.config.mjs     # PostCSS configuration
├── next.config.ts         # Next.js configuration
└── TODO.md                # Development task tracking
```

## Getting Started

### Prerequisites

- Ensure you have Node.js (version 18 or higher) installed on your system.
- Create a Storyblok account and set up a space to obtain the necessary API tokens.
- Install the Storyblok CLI globally if not already done: `npm install -g storyblok-cli`.

### Setup Instructions

1. **Install dependencies:**
   Run the following command in the project root to install all required packages:

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env.local` file in the project root and add the following variables. Replace the placeholder values with your actual Storyblok tokens (obtain these from your Storyblok space settings):

   ```
   STORYBLOK_ACCESS_TOKEN=your_storyblok_access_token
   STORYBLOK_MANAGEMENT_TOKEN=your_management_token
   STORYBLOK_SPACE_ID=your_space_id
   STORYBLOK_OAUTH_TOKEN=your_oauth_token
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_generative_ai_api_key_here  # Required for AI features
   ```

   - `STORYBLOK_ACCESS_TOKEN`: Token for Storyblok Management API to manage components.
   - `STORYBLOK_MANAGEMENT_TOKEN`: Token for managing components via the API.
   - `STORYBLOK_SPACE_ID`: Unique ID of your Storyblok space.
   - `STORYBLOK_OAUTH_TOKEN`: Token for OAuth authentication with Storyblok.
   - `GOOGLE_GENERATIVE_AI_API_KEY`: API key for Google Generative AI to enable AI-powered suggestions.

3. **Login to Storyblok CLI:**
   Authenticate with your Storyblok account using the CLI:

   ```bash
   npm run sb:login
   ```

   Follow the prompts to log in. This step is necessary for syncing and managing schemas.

4. **Start the Next.js frontend:**
   Launch the development server for the frontend:

   ```bash
   npm run dev
   ```

   This will start the server on `http://localhost:3000`. You should see output indicating the server is running.

5. **Start the Socket.IO server:**
   In a separate terminal, start the real-time collaboration server:

   ```bash
   node socket/server.js
   ```

   This server handles real-time updates and should run on port 3001 by default.

6. **Access the application:**
   Open your web browser and navigate to:

   ```
   http://localhost:3000
   ```

   You should now see the NexusHub interface.

7. **Test real-time collaboration:**
   Open the application in multiple browser windows or tabs to test live schema editing. Changes made in one window should reflect in others in real-time.

### Troubleshooting

- If you encounter issues with the Socket.IO server, ensure port 3001 is not in use and that Node.js is properly installed.
- For Storyblok-related errors, verify your tokens and space ID in the `.env.local` file.
- If AI features don't work, check that your Google Generative AI API key is valid and has sufficient credits.
- Run `npm run type-check` to ensure there are no TypeScript errors before starting.

## AI-Powered Schema Suggestions

NexusHub integrates Vercel AI SDK with Google Gemini 2.5 Pro to provide intelligent suggestions for improving your Storyblok component schemas. The AI assistant helps you:

- **Optimize schema structure** for better usability and maintainability
- **Add missing validation** rules and constraints
- **Improve field configurations** with best practices
- **Suggest additional fields** that might enhance your component

### How to Use AI Features

1. **Open the Schema Editor:** Navigate to the main interface where you can edit component schemas
2. **Click "AI Assist":** Look for the purple "🤖 AI Assist" button in the top-right area of the editor
3. **Review Suggestions:** The AI will analyze your current schema and provide improvement suggestions in a popup modal
4. **Apply Changes:** Use the suggestions to enhance your schema structure

### AI Configuration

The AI integration uses Google Gemini 2.5 Pro model through the Google Generative AI API. Make sure you have the required environment variables set up for the AI features to work properly:

```
GOOGLE_GENERATIVE_AI_API_KEY=your_google_generative_ai_api_key_here
```

## Enhanced Developer Workflows with Storyblok CLI

This project leverages the Storyblok CLI to automate schema management, migrations, and developer productivity.

### CLI Commands

- **Login:** `npm run sb:login` - Authenticate with Storyblok.
- **Pull Components:** `npm run sb:pull` - Sync local components with Storyblok space.
- **Push Components:** `npm run sb:push` - Push local changes to Storyblok.
- **Generate Migration:** `npm run sb:migrate` - Create migration files for schema changes.
- **Validate Schemas:** `npm run sb:validate` - Validate component schemas.
- **Sync Schemas:** `npm run sync-schemas` - Pull, type-check, and validate.
- **Deploy Schemas:** `npm run deploy-schemas` - Validate and push schemas.
- **Auto Sync:** `npm run auto-sync` - Automated pull, validate, and push.

### Automation and Productivity

- **Automated Testing:** `npm test` - Runs lint, type-check, and tests.
- **Pre-commit Hooks:** Lint-staged runs on commits for code quality.
- **Type Checking:** `npm run type-check` - Ensure TypeScript types are correct.
- **Git Hooks:** Husky ensures code quality before commits.

### Workflow Examples

- **Daily Sync:** Run `npm run sync-schemas` to pull latest changes.
- **Before Deploy:** Use `npm run deploy-schemas` to validate and push.
- **New Migration:** `npm run sb:migrate` to generate migration files.
- **CI/CD:** Integrate `npm run auto-sync` in deployment pipelines.

## Storyblok Integration

NexusHub leverages Storyblok as a headless CMS for managing component schemas with real-time collaboration. Storyblok is integrated through its Management API for CRUD operations, React SDK for editable components, and CLI for syncing and migrations. This allows developers to create, edit, and preview component schemas collaboratively in real-time.

### How Storyblok is Used in the Project

- **Configuration:** The `storyblok.config.js` file sets up the connection to your Storyblok space, including tokens and directories for components, stories, and datasources.
- **API Integration:** The `pages/api/storyblok.js` provides a Next.js API route for managing components via the Storyblok Management API, enabling create, read, update, and delete operations.
- **Component Structure:** Components like `Page.js` and `Teaser.js` use Storyblok's React SDK to render editable content, allowing for live editing in the Storyblok visual editor.
- **Real-time Collaboration:** Integrated with Socket.IO for live updates, enabling multiple users to edit schemas simultaneously.
- **CLI Tools:** Storyblok CLI commands are used for pulling, pushing, and migrating schemas, streamlining the development workflow.




