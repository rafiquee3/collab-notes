import { Editor, Range } from "@tiptap/core";

export const getSuggestionItems = ({ query }: { query: string }) => {
  return [
    {
      title: "Heading 1",
      description: "Large section heading",
      searchTerms: ["h1", "heading", "header"],
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 1 })
          .run();
      },
    },
    {
      title: "Heading 2",
      description: "Medium section heading",
      searchTerms: ["h2", "heading", "header"],
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 2 })
          .run();
      },
    },
    {
      title: "Heading 3",
      description: "Low section heading",
      searchTerms: ["h3", "heading", "header"],
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .setNode("heading", { level: 3 })
          .run();
      },
    },
    {
      title: "Task List",
      description: "Task list with checkboxes",
      searchTerms: ["todo", "task", "list", "tasks"],
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).toggleTaskList().run();
      },
    },
    {
      title: "Code Block",
      description: "Code block with syntax highlighting",
      searchTerms: ["code", "block", "programming"],
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: "Bullet List",
      description: "Classic bulleted list",
      searchTerms: ["list", "bullets", "points"],
      command: ({ editor, range }: { editor: Editor; range: Range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
  ]
    .filter((item) =>
      item.searchTerms.some((term) => term.includes(query.toLowerCase()))
    )
    .slice(0, 5); // Show only the best 5 results
};
