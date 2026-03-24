"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { useEffect, useState, useRef } from "react";
import { trpc } from "@/utils/trpc";
import { Toolbar } from "./Toolbar";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { CommandList } from "./CommandList";
import { getSuggestionItems } from "./editor/commands";
import { SlashCommand } from "./editor/slashExtension";

export function Editor({ noteId }: { noteId: string }) {
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const utils = trpc.useUtils();

  const { data: note, isLoading } = trpc.note.getById.useQuery(
    { id: noteId },
    { enabled: !!noteId }
  );

  const initialContent = (note as any)?.content;

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
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({
        nested: true,
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

  useEffect(() => {
    if (note && editor && !editor.isFocused) {
      editor.commands.setContent(initialContent || "");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, !!editor, initialContent]);

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
