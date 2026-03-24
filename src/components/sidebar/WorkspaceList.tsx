"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";

interface WorkspaceListProps {
  selectedWorkspaceId: string | null;
  onSelect: (id: string) => void;
}

export function WorkspaceList({ selectedWorkspaceId, onSelect }: WorkspaceListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState("");

  const utils = trpc.useUtils();

  const { data: workspaces, isLoading } = trpc.workspace.list.useQuery();

  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess: () => {
      utils.workspace.list.invalidate();
      setIsCreating(false);
      setNewWorkspaceName("");
    },
  });

  const updateWorkspace = trpc.workspace.update.useMutation({
    onSuccess: () => {
      utils.workspace.list.invalidate();
      setEditingWorkspaceId(null);
    },
  });

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    createWorkspace.mutate({ name: newWorkspaceName.trim() });
  };

  const handleRenameWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkspaceId || !editingWorkspaceName.trim()) {
      setEditingWorkspaceId(null);
      return;
    }
    updateWorkspace.mutate({ id: editingWorkspaceId, name: editingWorkspaceName.trim() });
  };

  const startEditingWorkspace = (id: string, name: string) => {
    setEditingWorkspaceId(id);
    setEditingWorkspaceName(name);
  };

  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-accent text-xs tracking-widest uppercase">Workspaces</h3>
        <button onClick={() => setIsCreating(true)} className="text-accent hover:text-foreground transition-colors" title="New Workspace">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {isLoading ? (
        <p className="text-accent animate-pulse text-xs tracking-widest uppercase">Loading...</p>
      ) : workspaces?.length === 0 && !isCreating ? (
        <p className="text-accent text-xs">No workspaces found.</p>
      ) : (
        <ul className="space-y-1">
          {workspaces?.map((ws: { id: string; name: string }) => (
            <li key={ws.id} className="group relative">
              {editingWorkspaceId === ws.id ? (
                <form onSubmit={handleRenameWorkspace} className="w-full">
                  <input
                    autoFocus
                    type="text"
                    value={editingWorkspaceName}
                    onChange={(e) => setEditingWorkspaceName(e.target.value)}
                    className="border-border text-foreground focus:border-accent/50 w-full border bg-transparent px-3 py-2 text-sm outline-none"
                    onBlur={() => handleRenameWorkspace(new Event("submit") as any)}
                  />
                </form>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => onSelect(ws.id)}
                    onDoubleClick={() => startEditingWorkspace(ws.id, ws.name)}
                    className={`w-full group-hover:border-border group-hover:bg-border/10 group-hover:text-foreground border px-3 py-2 text-left text-sm transition-all transition-colors ${
                      selectedWorkspaceId === ws.id
                        ? "border-border bg-border/20 text-foreground font-medium"
                        : "text-accent border-transparent"
                    }`}
                  >
                    {ws.name}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); startEditingWorkspace(ws.id, ws.name); }} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-accent hover:text-foreground p-1 transition-all" title="Rename">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
