/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Toolbar } from "./Toolbar";
import "@testing-library/jest-dom";

// Mock implementation of a Tiptap Editor
const createMockEditor = () => {
  const chain = {
    focus: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleUnderline: vi.fn().mockReturnThis(),
    toggleCodeBlock: vi.fn().mockReturnThis(),
    toggleBulletList: vi.fn().mockReturnThis(),
    toggleOrderedList: vi.fn().mockReturnThis(),
    toggleTaskList: vi.fn().mockReturnThis(),
    toggleHeading: vi.fn().mockReturnThis(),
    setParagraph: vi.fn().mockReturnThis(),
    run: vi.fn().mockReturnThis(),
  };

  return {
    chain: vi.fn(() => chain),
    isActive: vi.fn(() => false),
  } as any;
};

describe("Toolbar", () => {
  it("renders nothing if editor is null", () => {
    const { container } = render(<Toolbar editor={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("calls toggleBold when Bold button is clicked", () => {
    const editor = createMockEditor();
    render(<Toolbar editor={editor} />);

    const boldButton = screen.getByTitle("Bold");
    fireEvent.click(boldButton);

    expect(editor.chain).toHaveBeenCalled();
    expect(editor.chain().focus().toggleBold).toHaveBeenCalled();
    expect(editor.chain().run).toHaveBeenCalled();
  });

  it("calls toggleItalic when Italic button is clicked", () => {
    const editor = createMockEditor();
    render(<Toolbar editor={editor} />);

    const italicButton = screen.getByTitle("Italic");
    fireEvent.click(italicButton);

    expect(editor.chain().focus().toggleItalic).toHaveBeenCalled();
  });

  it("calls toggleHeading when heading select value changes", () => {
    const editor = createMockEditor();
    render(<Toolbar editor={editor} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "1" } });

    expect(editor.chain().focus().toggleHeading).toHaveBeenCalledWith({ level: 1 });
  });

  it("calls setParagraph when 'Paragraph' is selected from heading select", () => {
    const editor = createMockEditor();
    render(<Toolbar editor={editor} />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "0" } });

    expect(editor.chain().focus().setParagraph).toHaveBeenCalled();
  });

  it("highlights active buttons based on editor.isActive state", () => {
    const editor = createMockEditor();
    editor.isActive = vi.fn((type) => type === "bold");
    
    render(<Toolbar editor={editor} />);

    const boldButton = screen.getByTitle("Bold");
    expect(boldButton).toHaveClass("bg-accent");
    
    const italicButton = screen.getByTitle("Italic");
    expect(italicButton).not.toHaveClass("bg-accent");
  });
});
