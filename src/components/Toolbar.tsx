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
  ];

  const handleHeadingChange = (level: number) => {
    if (level === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor
        .chain()
        .focus()
        .toggleHeading({ level: level as any })
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
    <div className="border-border bg-background/50 sticky top-0 z-10 flex flex-wrap items-center gap-1 border-b p-2 backdrop-blur-sm">
      <select
        value={currentHeading}
        onChange={(e) => handleHeadingChange(parseInt(e.target.value))}
        className="border-border text-accent hover:border-border hover:bg-border/10 hover:text-foreground h-8 border bg-transparent px-2 text-xs font-medium transition-colors outline-none"
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
          className={`flex h-8 min-w-[32px] items-center justify-center border px-2 text-xs font-medium transition-colors ${
            btn.isActive
              ? "border-border bg-border/20 text-foreground"
              : "text-accent hover:border-border hover:bg-border/10 hover:text-foreground border-transparent"
          }`}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
