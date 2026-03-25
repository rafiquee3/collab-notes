import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const dragHandlePluginKey = new PluginKey("globalDragHandle");

/**
 * Global drag handle extension for TipTap.
 * Adds a floating drag grip handle to the left of each top-level block
 * when the user hovers over it. The handle uses native HTML5 drag & drop
 * to allow block reordering within the ProseMirror document.
 */
export const GlobalDragHandle = Extension.create({
  name: "globalDragHandle",

  addProseMirrorPlugins() {
    let dragHandleElement: HTMLElement | null = null;
    let currentBlockPos: number | null = null;
    const editorView = this.editor.view;

    return [
      new Plugin({
        key: dragHandlePluginKey,
        view: () => {
          // Create the handle element
          dragHandleElement = document.createElement("div");
          dragHandleElement.className = "global-drag-handle";
          dragHandleElement.setAttribute("draggable", "true");
          dragHandleElement.contentEditable = "false";
          dragHandleElement.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5"/>
              <circle cx="11" cy="3" r="1.5"/>
              <circle cx="5" cy="8" r="1.5"/>
              <circle cx="11" cy="8" r="1.5"/>
              <circle cx="5" cy="13" r="1.5"/>
              <circle cx="11" cy="13" r="1.5"/>
            </svg>
          `;

          // We will append to the DOM dynamically on the first mousemove
          // when we are guaranteed that all React containers have rendered.

          // Handle dragstart — serialize the block node
          dragHandleElement.addEventListener("dragstart", (e) => {
            if (currentBlockPos === null) return;
            const { state } = editorView;
            const nodeAtPos = state.doc.nodeAt(currentBlockPos);
            if (!nodeAtPos) return;

            // Use ProseMirror's NodeSelection to set drag data
            const { tr } = state;
            const resolvedPos = state.doc.resolve(currentBlockPos);

            // Set the selection to the block for ProseMirror's drag handler
            const nodeSelection =
              // @ts-ignore
              editorView.state.selection.constructor.near(resolvedPos);

            editorView.dispatch(
              tr.setSelection(
                // @ts-ignore
                new (require("@tiptap/pm/state").NodeSelection)(resolvedPos)
              )
            );

            // Let ProseMirror handle the drag with proper slice data
            // @ts-ignore
            editorView.dragging = {
              slice: state.doc.slice(
                currentBlockPos,
                currentBlockPos + nodeAtPos.nodeSize
              ),
              move: true,
            };

            if (e.dataTransfer) {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setDragImage(dragHandleElement!, 0, 0);
            }

            dragHandleElement!.classList.add("dragging");
          });

          dragHandleElement.addEventListener("dragend", () => {
            dragHandleElement?.classList.remove("dragging");
          });

          return {
            destroy: () => {
              dragHandleElement?.remove();
              dragHandleElement = null;
            },
          };
        },

        props: {
          handleDOMEvents: {
            mousemove: (view, event) => {
              if (!dragHandleElement) return false;

              const scroller = document.getElementById("editor-scroller");
              if (!scroller) return false;

              // Ensure drag handle is attached to the scroller
              if (dragHandleElement.parentElement !== scroller) {
                scroller.appendChild(dragHandleElement);
              }

              const editorRect = view.dom.getBoundingClientRect();

              // Find the block node under cursor
              const pos = view.posAtCoords({
                left: editorRect.left + 50,
                top: event.clientY,
              });

              if (!pos) {
                dragHandleElement.style.opacity = "0";
                dragHandleElement.style.pointerEvents = "none";
                return false;
              }

              // Resolve to top-level block
              const resolved = view.state.doc.resolve(pos.pos);
              const topLevelPos = resolved.before(1);
              const topLevelNode = view.state.doc.nodeAt(topLevelPos);

              if (!topLevelNode) {
                dragHandleElement.style.opacity = "0";
                dragHandleElement.style.pointerEvents = "none";
                return false;
              }

              currentBlockPos = topLevelPos;

              // Position the handle
              const blockDom = view.nodeDOM(topLevelPos);
              if (blockDom && blockDom instanceof HTMLElement) {
                const blockRect = blockDom.getBoundingClientRect();
                const scrollerRect = scroller.getBoundingClientRect();
                
                // Position relative to the scrolling container
                dragHandleElement.style.top = `${blockRect.top - scrollerRect.top + scroller.scrollTop + 2}px`;
                // Safely distance from left edge by 20px (well clear of the sidebar)
                dragHandleElement.style.left = "20px";
                dragHandleElement.style.opacity = "1";
                dragHandleElement.style.pointerEvents = "auto";
              }

              return false;
            },

            mouseleave: () => {
              if (dragHandleElement) {
                dragHandleElement.style.opacity = "0";
                dragHandleElement.style.pointerEvents = "none";
              }
              return false;
            },
          },

          // Show drop cursor when dragging
          handleDrop: (view, event, slice, moved) => {
            // Let ProseMirror handle the native drop
            return false;
          },
        },
      }),
    ];
  },
});
