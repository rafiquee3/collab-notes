"use client";

import { useEffect, useState, useMemo } from "react";
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

  // Use state managed document and provider for React render cycle
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);

  // Initialize Yjs document and WebSocket provider with a small delay to prevent race conditions
  useEffect(() => {
    const timeout = setTimeout(() => {
      const newYdoc = new Y.Doc();
      const newProvider = new WebsocketProvider(
        process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || "ws://localhost:1234",
        `note-${noteId}`,
        newYdoc
      );

      setYdoc(newYdoc);
      setProvider(newProvider);

      const onStatus = (event: { status: string }) => {
        if (event.status === "connected") {
          setIsReady(true);
        }
      };

      newProvider.on("status", onStatus);

      const updateUsers = () => {
        setConnectedUsers(newProvider.awareness.getStates().size);
      };
      newProvider.awareness.on("change", updateUsers);
      updateUsers();

      if (newProvider.wsconnected) {
        setIsReady(true);
      }
    }, 150); // 150ms debounce for note switching

    const fallbackTimer = setTimeout(() => {
      setIsReady(true);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      clearTimeout(fallbackTimer);

      setProvider((prevProvider) => {
        if (prevProvider) {
          prevProvider.disconnect();
          prevProvider.destroy();
        }
        return null;
      });
      setYdoc((prevYdoc) => {
        if (prevYdoc) {
          prevYdoc.destroy();
        }
        return null;
      });
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
  if (!isReady || isLoading || !ydoc || !provider) {
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
      ydoc={ydoc}
      provider={provider}
      connectedUsers={connectedUsers}
      initialContent={initialContent}
      note={note}
      userName={userName}
      userColor={userColor}
    />
  );
}
