"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { trpc } from "@/utils/trpc";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useSession } from "next-auth/react";
import { CollabEditor } from "./CollabEditor";

const colors = [
  "#958DF1",
  "#F98181",
  "#FBBC88",
  "#FAF594",
  "#70C2B4",
  "#94FADB",
  "#B9EDFB",
];
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

/**
 * Main Editor shell — manages Yjs lifecycle with useRef + useEffect.
 * Only renders CollabEditor once everything is ready.
 */
export function Editor({ noteId }: { noteId: string }) {
  const { data: session } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [connectedUsers, setConnectedUsers] = useState(0);

  // Use refs instead of useMemo to prevent React strict-mode double-init issues
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);

  // Initialize Yjs document and WebSocket provider in useEffect (client-only)
  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      `note-${noteId}`,
      ydoc
    );

    ydocRef.current = ydoc;
    providerRef.current = provider;

    // Track connection status
    const onStatus = (event: { status: string }) => {
      console.log("Collab status:", event.status);
      if (event.status === "connected") {
        setIsReady(true);
      }
    };

    provider.on("status", onStatus);

    // Track awareness (connected users)
    const updateUsers = () => {
      setConnectedUsers(provider.awareness.getStates().size);
    };
    provider.awareness.on("change", updateUsers);
    updateUsers();

    // If already connected (e.g. reconnect), mark ready
    if (provider.wsconnected) {
      setIsReady(true);
    }

    // Fallback: mount editor after 2s even if WS hasn't connected yet
    // y-websocket will auto-reconnect in background
    const fallbackTimer = setTimeout(() => {
      setIsReady(true);
    }, 2000);

    return () => {
      clearTimeout(fallbackTimer);
      provider.off("status", onStatus);
      provider.awareness.off("change", updateUsers);
      provider.disconnect();
      provider.destroy();
      ydoc.destroy();
      ydocRef.current = null;
      providerRef.current = null;
      setIsReady(false);
      setConnectedUsers(0);
    };
  }, [noteId]);

  // Fetch note data from DB
  const { data: note, isLoading } = trpc.note.getById.useQuery(
    { id: noteId },
    { enabled: !!noteId }
  );

  const initialContent = (note as any)?.content;

  const userColor = useMemo(() => getRandomColor(), []);
  const userName = session?.user?.name || "Anonymous";

  // Show loading until WebSocket is connected AND note data is fetched
  if (!isReady || isLoading || !ydocRef.current || !providerRef.current) {
    return (
      <div className="flex-1 p-8 lg:p-16">
        <div className="text-accent animate-pulse text-xs tracking-widest uppercase">
          Connecting to collaboration server...
        </div>
      </div>
    );
  }

  return (
    <CollabEditor
      noteId={noteId}
      ydoc={ydocRef.current}
      provider={providerRef.current}
      connectedUsers={connectedUsers}
      initialContent={initialContent}
      note={note}
      userName={userName}
      userColor={userColor}
    />
  );
}
