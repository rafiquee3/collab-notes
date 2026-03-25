"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Editor } from "@tiptap/core";

interface BlockItem {
  id: string;
  pos: number;
  size: number;
  type: string;
  textContent: string;
}

function getBlocks(editor: Editor): BlockItem[] {
  const blocks: BlockItem[] = [];
  const { doc } = editor.state;

  doc.forEach((node, pos, index) => {
    blocks.push({
      id: `block-${index}`,
      pos,
      size: node.nodeSize,
      type: node.type.name,
      textContent: node.textContent.slice(0, 80),
    });
  });

  return blocks;
}

function SortableBlock({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="dnd-block-wrapper group">
      <button
        className="dnd-drag-handle"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="currentColor"
        >
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>
      {children}
    </div>
  );
}

export function DndBlockEditor({
  editor,
  children,
}: {
  editor: Editor | null;
  children: React.ReactNode;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<BlockItem[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Refresh block list whenever drag starts
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      if (!editor) return;
      setActiveId(event.active.id as string);
      setBlocks(getBlocks(editor));
    },
    [editor]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!editor || !over || active.id === over.id) return;

      const currentBlocks = getBlocks(editor);
      const oldIndex = currentBlocks.findIndex((b) => b.id === active.id);
      const newIndex = currentBlocks.findIndex((b) => b.id === over.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const block = currentBlocks[oldIndex];
      const { state, dispatch } = editor.view;
      const { tr } = state;

      // Get the node at the source position
      const sourceNode = state.doc.nodeAt(block.pos);
      if (!sourceNode) return;

      // Step 1: Delete the source node
      tr.delete(block.pos, block.pos + block.size);

      // Step 2: Calculate new target position after deletion
      const mappedBlocks = getBlocks({
        state: { doc: tr.doc },
      } as any);

      let targetPos: number;
      if (newIndex >= mappedBlocks.length) {
        // Move to end
        targetPos = tr.doc.content.size;
      } else {
        targetPos = mappedBlocks[newIndex].pos;
        // If moving down, don't adjust; if moving up, insert before target
      }

      // Step 3: Insert the node at the target position
      tr.insert(targetPos, sourceNode);

      dispatch(tr);
      editor.commands.focus();
    },
    [editor]
  );

  const activeBlock = blocks.find((b) => b.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {children}
      <DragOverlay dropAnimation={null}>
        {activeBlock ? (
          <div className="dnd-drag-overlay">
            <span className="dnd-overlay-type">{activeBlock.type}</span>
            <span className="dnd-overlay-text">
              {activeBlock.textContent || "Empty block"}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export { SortableBlock, getBlocks };
export type { BlockItem };
