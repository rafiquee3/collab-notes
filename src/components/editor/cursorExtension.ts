import { Extension } from "@tiptap/core";
import { ySyncPlugin, yCursorPlugin, yUndoPlugin } from "y-prosemirror";
import type * as Y from "yjs";
import type { WebsocketProvider } from "y-websocket";

export interface YjsCollabOptions {
  document: Y.Doc;
  provider: WebsocketProvider;
  user: {
    name: string;
    color: string;
  };
  field: string;
}

/**
 * Single unified extension that bundles ySyncPlugin, yCursorPlugin, and yUndoPlugin
 * from y-prosemirror. All three plugins MUST come from the same extension to guarantee
 * the correct initialization order in ProseMirror (sync must init before cursor).
 */
export const YjsCollab = Extension.create<YjsCollabOptions>({
  name: "yjsCollab",

  addOptions() {
    return {
      document: null as any,
      provider: null as any,
      user: {
        name: "Anonymous",
        color: "#958DF1",
      },
      field: "default",
    };
  },

  addProseMirrorPlugins() {
    const { document: ydoc, provider, user, field } = this.options;
    const fragment = ydoc.getXmlFragment(field);

    // IMPORTANT: ySyncPlugin MUST come before yCursorPlugin
    // because the cursor plugin reads from the sync plugin's state
    return [
      ySyncPlugin(fragment),
      yCursorPlugin(provider.awareness, {
        cursorBuilder: (awarenessUser: any) => {
          const displayColor = awarenessUser?.color || user.color;
          const displayName = awarenessUser?.name || "Anonymous";

          const cursor = document.createElement("span");
          cursor.classList.add("collaboration-cursor__caret");
          cursor.style.borderColor = displayColor;

          const label = document.createElement("div");
          label.classList.add("collaboration-cursor__label");
          label.style.backgroundColor = displayColor;
          label.textContent = displayName;

          cursor.appendChild(label);
          return cursor;
        },
      }),
      yUndoPlugin(),
    ];
  },
});
