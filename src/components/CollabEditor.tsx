"use client";

import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { all, createLowlight } from "lowlight";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useEffect, useState, useRef, useMemo } from "react";
import { trpc } from "@/utils/trpc";
import { Toolbar } from "./Toolbar";
import tippy from "tippy.js";
import { CommandList } from "./CommandList";
import { getSuggestionItems } from "./editor/commands";
import { SlashCommand } from "./editor/slashExtension";
import { YjsCollab } from "./editor/cursorExtension";
import { GlobalDragHandle } from "./editor/dragHandleExtension";
import { VersionHistory } from "./VersionHistory";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";

const lowlight = createLowlight(all);

interface CollabEditorProps {
  noteId: string;
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  connectedUsers: number;
  initialContent: any;
  note: any;
  userName: string;
  userColor: string;
}

/**
 * Inner editor component that only mounts when ydoc + provider are fully ready.
 * By the time this renders, all Yjs objects are guaranteed to be stable.
 */
export function CollabEditor({
  noteId,
  ydoc,
  provider,
  connectedUsers,
  initialContent,
  note,
  userName,
  userColor,
}: CollabEditorProps) {
  const utils = trpc.useUtils();
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedInitial = useRef(false);
  const lastSnapshotContent = useRef<string>("");

  const updateNote = trpc.note.update.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      utils.note.list.invalidate();
    },
  });

  const createVersion = (trpc.note.createVersion.useMutation as any)({
    onSuccess: () => {
      console.log("Snapshot version created");
      utils.note.listVersions.invalidate({ noteId });
    },
    onError: (err: any) => {
      console.error("Failed to create snapshot:", err);
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
      GlobalDragHandle,
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
    [userName, userColor, ydoc, provider]
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

  // Sync awareness info when user details are available/change
  useEffect(() => {
    if (!provider || !userName || !userColor) return;

    provider.awareness.setLocalStateField("user", {
      name: userName,
      color: userColor,
    });
  }, [provider, userName, userColor]);

  // Periodic Snapshot Logic
  useEffect(() => {
    if (!editor) return;

    const SNAPSHOT_INTERVAL = 10 * 60 * 1000; // 10 minutes

    // Initialize the ref with current content as soon as the editor is ready
    if (!lastSnapshotContent.current && !editor.isEmpty) {
      lastSnapshotContent.current = JSON.stringify(editor.getJSON());
    }

    const timer = setInterval(() => {
      if (editor.isEmpty) return;

      const currentContent = JSON.stringify(editor.getJSON());

      if (currentContent !== lastSnapshotContent.current) {
        createVersion.mutate({
          noteId,
          content: editor.getJSON(),
        });
        lastSnapshotContent.current = currentContent;
      }
    }, SNAPSHOT_INTERVAL);

    return () => clearInterval(timer);
  }, [editor, noteId]);

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
        <div className="flex items-center gap-4">
          {isSaving && (
            <span className="text-accent animate-pulse text-[10px] tracking-widest uppercase">
              Saving...
            </span>
          )}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`text-xs font-medium tracking-widest uppercase transition-colors ${
              showHistory
                ? "text-foreground"
                : "text-accent hover:text-foreground"
            }`}
          >
            History
          </button>
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div
          id="editor-scroller"
          className="bg-background/50 relative flex-1 overflow-y-auto"
        >
          <EditorContent editor={editor} />
        </div>

        {showHistory && (
          <div className="border-border bg-surface z-10 h-full w-80 flex-shrink-0 border-l transition-all">
            <VersionHistory
              noteId={noteId}
              onRestore={(content) => {
                editor?.commands.setContent(content);
                setShowHistory(false);
              }}
              onClose={() => setShowHistory(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
