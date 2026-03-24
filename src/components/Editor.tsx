"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { useEffect, useState, useRef } from "react";
import { trpc } from "@/utils/trpc";
import { Toolbar } from "./Toolbar";

export function Editor({ noteId }: { noteId: string }) {
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const utils = trpc.useUtils();

  const { data: note, isLoading } = trpc.note.getById.useQuery(
    { id: noteId },
    { enabled: !!noteId }
  );

  const updateNote = trpc.note.update.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      utils.note.list.invalidate();
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
    ],
    immediatelyRender: false,
    content: "",
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[500px] p-8 lg:p-16 text-foreground",
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

  useEffect(() => {
    if (note && editor && !editor.isFocused) {
      editor.commands.setContent((note.content as any) || "");
    }
  }, [note, editor]);

  // Cleanup timeout on unmount or note change
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [noteId]);

  if (isLoading) {
    return (
      <div className="flex-1 p-8 lg:p-16">
        <div className="text-accent animate-pulse text-xs tracking-widest uppercase">
          Loading Note...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="border-border flex items-center justify-between border-b px-6 py-2">
        <Toolbar editor={editor} />
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
