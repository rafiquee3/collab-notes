"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { trpc } from "@/utils/trpc";
import { Toolbar } from "./Toolbar";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { CommandList } from "./CommandList";
import { getSuggestionItems } from "./editor/commands";
import { SlashCommand } from "./editor/slashExtension";
import { YjsCollab } from "./editor/cursorExtension";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useSession } from "next-auth/react";

const lowlight = createLowlight(all);

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
 * Inner editor component that only mounts when ydoc + provider are fully ready.
 * By the time this renders, all Yjs objects are guaranteed to be stable.
 */
function CollabEditor({
  noteId,
  ydoc,
  provider,
  connectedUsers,
  initialContent,
  note,
  userName,
  userColor,
}: {
  noteId: string;
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  connectedUsers: number;
  initialContent: any;
  note: any;
  userName: string;
  userColor: string;
}) {
  const utils = trpc.useUtils();
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedInitial = useRef(false);

  const updateNote = trpc.note.update.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      utils.note.list.invalidate();
    },
  });

  // Build extensions once — ydoc and provider are stable refs at this point
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      YjsCollab.configure({
        document: ydoc,
        provider: provider,
        user: {
          name: userName,
          color: userColor,
        },
      }),
      SlashCommand.configure({
        suggestion: {
          items: getSuggestionItems,
          render: () => {
            let component: ReactRenderer | null = null;
            let popup: any | null = null;

            return {
              onStart: (props) => {
                component = new ReactRenderer(CommandList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect as any,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                });
              },
              onUpdate(props) {
                component?.updateProps(props);

                if (!props.clientRect) {
                  return;
                }

                popup?.[0].setProps({
                  getReferenceClientRect: props.clientRect as any,
                });
              },
              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup?.[0].hide();
                  return true;
                }
                return (component?.ref as any)?.onKeyDown(props);
              },
              onExit() {
                popup?.[0].destroy();
                component?.destroy();
              },
            };
          },
        },
      }),
    ],
    // ydoc is stable (created via useRef in parent, not changing)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    content: "",
    editorProps: {
      attributes: {
        class:
          "tiptap-editor max-w-none focus:outline-none min-h-[500px] p-8 lg:p-16 text-foreground",
      },
    },
    onUpdate: ({ editor }) => {
      const content = editor.getJSON();
      setIsSaving(true);

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        updateNote.mutate({ id: noteId, content });
      }, 1000);
    },
  });

  // Load initial content from DB only once, only if the Yjs doc is empty
  useEffect(() => {
    if (!editor || !note || hasLoadedInitial.current) return;

    // Wait a tick for Yjs sync to potentially fill the doc
    const timer = setTimeout(() => {
      if (editor.isEmpty && initialContent) {
        editor.commands.setContent(initialContent);
      }
      hasLoadedInitial.current = true;
    }, 500);

    return () => clearTimeout(timer);
  }, [editor, note, initialContent]);

  // Cleanup save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-border flex items-center justify-between border-b px-6 py-2">
        <div className="flex items-center gap-4">
          <Toolbar editor={editor} />
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-accent text-[10px] tracking-widest uppercase">
              {connectedUsers} {connectedUsers === 1 ? "user" : "users"} live
            </span>
          </div>
        </div>
        {isSaving && (
          <span className="text-accent animate-pulse text-[10px] tracking-widest uppercase">
            Saving...
          </span>
        )}
      </div>
      <div className="bg-background/50 flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

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
