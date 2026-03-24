"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { trpc } from "@/utils/trpc";

export function Sidebar({
  activeNoteId,
  onNoteSelect,
}: {
  activeNoteId?: string | null;
  onNoteSelect: (id: string) => void;
}) {
  const { data: session } = useSession();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");

  const utils = trpc.useUtils();

  const { data: workspaces, isLoading: isLoadingWorkspaces } =
    trpc.workspace.list.useQuery(undefined, {
      enabled: !!session,
    });

  const { data: notes, isLoading: isLoadingNotes } = trpc.note.list.useQuery(
    { workspaceId: selectedWorkspaceId as string },
    { enabled: !!selectedWorkspaceId }
  );

  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess: () => {
      utils.workspace.list.invalidate();
      setIsCreating(false);
      setNewWorkspaceName("");
    },
  });

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    createWorkspace.mutate({ name: newWorkspaceName });
  };

  const createNote = trpc.note.create.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate({
        workspaceId: selectedWorkspaceId as string,
      });
      setIsCreatingNote(false);
      setNewNoteTitle("");
    },
  });

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !selectedWorkspaceId) return;
    createNote.mutate({
      workspaceId: selectedWorkspaceId,
      title: newNoteTitle.trim(),
    });
  };

  return (
    <aside className="border-border bg-background flex min-h-screen w-72 flex-col border-r">
      <div className="flex-1 overflow-y-auto p-6">
        {/* User Info */}
        <div className="mb-12 flex items-center gap-4">
          <div className="border-border bg-border/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs tracking-widest uppercase">
            {session?.user?.name?.charAt(0) ||
              session?.user?.email?.charAt(0) ||
              "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <h2 className="text-foreground truncate text-sm font-bold">
              {session?.user?.name || "Anonymous"}
            </h2>
            <p className="text-accent truncate text-xs">
              {session?.user?.email}
            </p>
          </div>
        </div>

        {/* Workspaces */}
        <div className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-accent text-xs tracking-widest uppercase">
              Workspaces
            </h3>
            <button
              onClick={() => setIsCreating(true)}
              className="text-accent hover:text-foreground transition-colors"
              title="New Workspace"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          {isCreating && (
            <form onSubmit={handleCreateWorkspace} className="mb-4">
              <input
                autoFocus
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Workspace name..."
                className="border-border text-foreground focus:border-accent/50 w-full border bg-transparent px-3 py-2 text-sm outline-none"
                onBlur={() => !newWorkspaceName && setIsCreating(false)}
              />
            </form>
          )}

          {isLoadingWorkspaces ? (
            <p className="text-accent animate-pulse text-xs tracking-widest">
              Loading...
            </p>
          ) : workspaces?.length === 0 && !isCreating ? (
            <p className="text-accent text-xs">No workspaces found.</p>
          ) : (
            <ul className="space-y-1">
              {workspaces?.map((ws: { id: string; name: string }) => (
                <li key={ws.id}>
                  <button
                    onClick={() => setSelectedWorkspaceId(ws.id)}
                    className={`w-full border px-3 py-2 text-left text-sm transition-colors ${
                      selectedWorkspaceId === ws.id
                        ? "border-border bg-border/20 text-foreground"
                        : "text-accent hover:border-border hover:bg-border/10 hover:text-foreground border-transparent"
                    }`}
                  >
                    {ws.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notes */}
        {selectedWorkspaceId && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-accent text-xs tracking-widest uppercase">
                Notes
              </h3>
              <button
                onClick={() => setIsCreatingNote(true)}
                className="text-accent hover:text-foreground transition-colors"
                title="New Note"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>

            {isCreatingNote && (
              <form onSubmit={handleCreateNote} className="mb-4">
                <input
                  autoFocus
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Note title..."
                  className="border-border text-foreground focus:border-accent/50 w-full border bg-transparent px-3 py-2 text-sm outline-none"
                  onBlur={() => !newNoteTitle && setIsCreatingNote(false)}
                />
              </form>
            )}

            {isLoadingNotes ? (
              <p className="text-accent animate-pulse text-xs tracking-widest">
                Loading...
              </p>
            ) : notes?.length === 0 && !isCreatingNote ? (
              <p className="text-accent text-xs">No notes found.</p>
            ) : (
              <ul className="space-y-1">
                {notes?.map((note: { id: string; title: string | null }) => (
                  <li key={note.id}>
                    <button
                      onClick={() => onNoteSelect(note.id)}
                      className={`text-accent hover:border-border hover:bg-border/10 hover:text-foreground w-full truncate border px-3 py-2 text-left text-sm transition-all transition-colors ${
                        activeNoteId === note.id
                          ? "border-border bg-border/20 text-foreground"
                          : "border-transparent"
                      }`}
                    >
                      {note.title || "Untitled"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Logout */}
      {session && (
        <div className="border-border mt-auto border-t p-6">
          <button
            onClick={() => signOut()}
            className="text-accent hover:text-foreground w-full text-left text-xs tracking-widest uppercase transition-colors"
          >
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
