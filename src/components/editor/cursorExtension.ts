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

    // Set local awareness state with user info
    provider.awareness.setLocalStateField("user", {
      name: user.name,
      color: user.color,
    });

    // IMPORTANT: ySyncPlugin MUST come before yCursorPlugin
    // because the cursor plugin reads from the sync plugin's state
    return [
      ySyncPlugin(fragment),
      yCursorPlugin(provider.awareness, {
        cursorBuilder: (awarenessUser: Record<string, string>) => {
          const cursor = document.createElement("span");
          cursor.classList.add("collaboration-cursor__caret");
          cursor.style.borderColor = awarenessUser.color || user.color;

          const label = document.createElement("div");
          label.classList.add("collaboration-cursor__label");
          label.style.backgroundColor = awarenessUser.color || user.color;
          label.textContent = awarenessUser.name || "Anonymous";

          cursor.appendChild(label);
          return cursor;
        },
      }),
      yUndoPlugin(),
    ];
  },
});
