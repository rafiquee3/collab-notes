# CollabNotes 📝

A modern, real-time collaborative note-taking application designed for seamless team productivity. Built with Next.js and powered by Yjs, CollabNotes allows multiple users to edit the same rich-text document simultaneously, similar to Google Docs or Notion.

**🌐 Live Demo:** [https://collab-notes-blue.vercel.app](https://collab-notes-blue.vercel.app)

---

## ✨ Features

- **Real-Time Collaboration:** Powered by `Yjs` and WebSockets, see exactly what your colleagues are typing as they type it.
- **Rich Text Editing:** A editor built on top of `Tiptap` with support for headings, bold/italic, lists (ul, ol, tasks), code blocks, and blockquotes.
- **Visual Presence:** Live cursors and colored tags show the activity of other users currently in the workspace.
- **User Authentication:** Secure login and registration flows powered by `NextAuth.js`.
- **Workspaces & Organization:** Create customized workspaces to organize your notes efficiently.
- **Version History:** Track changes and restore previous snapshots of your document in seconds.
- **Fully Responsive:** Carefully crafted mobile UI featuring a slide-over navigation drawer and horizontal scrollable toolbars.

## 🛠️ Technology Stack

This application is built using a modern, full-stack TypeScript architecture:

### Frontend

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS (with highly customized utility classes)
- **Editor:** Tiptap / ProseMirror
- **State Management & Caching:** React Query

### Backend & Collaboration

- **API:** tRPC for end-to-end typesafe data fetching
- **Database:** PostgreSQL accessed via Prisma ORM
- **Authentication:** NextAuth.js
- **Real-Time Server:** Custom Node.js WebSocket server utilizing `y-websocket`

### Deployment Structure

- **Frontend & API:** Hosted on [Vercel](https://vercel.com) for edge-optimized performance.
- **WebSocket Server:** Hosted on [Render](https://render.com) for uninterrupted, stable `wss://` connections.

---

## 🚀 Getting Started Locally

If you'd like to run a local instance of CollabNotes, simply follow these steps:

### Prerequisites

- Node.js (v18+)
- Local or Cloud PostgreSQL database instance

### 1. Clone the repository

```bash
git clone https://github.com/rafiquee3/collab-notes.git
cd collab-notes
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory based on `.env.example` structure. You'll need to define:

```env
DATABASE_URL="postgres://user:password@localhost:5432/collab_notes"
NEXTAUTH_SECRET="your_very_secret_key"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_COLLAB_SERVER_URL="ws://localhost:1234"
```

### 4. Setup the Database

Push the Prisma schema to your database.

```bash
npx prisma db push
```

### 5. Start the Application

You need to run two processes simultaneously: the Next.js frontend and the WebSocket server.

**Terminal 1 (Next.js):**

```bash
npm run dev
```

**Terminal 2 (WebSocket Server):**

```bash
npm run start:collab
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
Have fun collaborating!

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
