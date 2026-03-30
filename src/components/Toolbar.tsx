"use client";

import { Editor } from "@tiptap/react";

interface ToolbarProps {
  editor: Editor | null;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const buttons = [
    {
      label: "B",
      title: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      label: "I",
      title: "Italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      label: "U",
      title: "Underline",
      action: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
    },
    {
      label: "Code",
      title: "Code Block",
      action: () => editor.chain().focus().toggleCodeBlock().run(),
      isActive: editor.isActive("codeBlock"),
    },
    {
      label: "List",
      title: "Bullet List",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      label: "1.",
      title: "Ordered List",
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
    },
    {
      label: "Tasks",
      title: "Task List",
      action: () => editor.chain().focus().toggleTaskList().run(),
      isActive: editor.isActive("taskList"),
    },
  ];

  const handleHeadingChange = (level: number) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor
        .chain()
        .focus()
        .toggleHeading({ level: level as 1 | 2 | 3 })
        .run();
    }
  };

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? 1
    : editor.isActive("heading", { level: 2 })
      ? 2
      : editor.isActive("heading", { level: 3 })
        ? 3
        : 0;

  return (
    <div className="border-white bg-background/50 sticky top-0 z-10 flex w-max min-w-full md:min-w-0 md:w-auto flex-nowrap md:flex-wrap items-center gap-1 rounded-xl border p-2 backdrop-blur-sm shadow-sm transition-all pb-2 md:pb-2">
      <select
        value={currentHeading}
        onChange={(e) => handleHeadingChange(parseInt(e.target.value))}
        className="border-border text-slate-600 hover:border-accent hover:bg-accent/5 hover:text-accent h-8 rounded-lg border bg-surface px-2 text-xs font-semibold transition-all outline-none"
      >
        <option value={0} className="bg-background">
          Paragraph
        </option>
        <option value={1} className="bg-background text-lg font-bold">
          Heading 1
        </option>
        <option value={2} className="bg-background text-base font-bold">
          Heading 2
        </option>
        <option value={3} className="bg-background text-sm font-bold">
          Heading 3
        </option>
      </select>

      {buttons.map((btn) => (
        <button
          key={btn.title}
          onClick={btn.action}
          title={btn.title}
          className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-bold transition-all ${
            btn.isActive
              ? "bg-accent text-white shadow-sm"
              : "text-slate-500 hover:bg-accent/5 hover:text-accent"
          }`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
