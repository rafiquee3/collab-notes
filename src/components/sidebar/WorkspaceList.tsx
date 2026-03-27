"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useEffect, useRef } from "react";

interface WorkspaceListProps {
  selectedWorkspaceId: string | null;
  onSelect: (id: string) => void;
}

export function WorkspaceList({
  selectedWorkspaceId,
  onSelect,
}: WorkspaceListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(
    null
  );
  const [editingWorkspaceName, setEditingWorkspaceName] = useState("");

  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const syncMapRef = useRef<Y.Map<any> | null>(null);

  useEffect(() => {
    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      "workspace-list-sync",
      doc
    );
    
    const syncMap = doc.getMap("sync");
    syncMapRef.current = syncMap;

    const handleSync = () => {
      utils.workspace.list.invalidate();
    };

    syncMap.observe(handleSync);

    return () => {
      syncMap.unobserve(handleSync);
      provider.destroy();
      doc.destroy();
      syncMapRef.current = null;
    };
  }, [utils]);

  const broadcastUpdate = () => {
    syncMapRef.current?.set("lastUpdate", Date.now());
  };

  const { data: workspaces, isLoading } = trpc.workspace.list.useQuery();

  const createWorkspace = trpc.workspace.create.useMutation({
    onSuccess: () => {
      utils.workspace.list.invalidate();
      broadcastUpdate();
      setIsCreating(false);
      setNewWorkspaceName("");
    },
  });


  const updateWorkspace = trpc.workspace.update.useMutation({
    onSuccess: () => {
      utils.workspace.list.invalidate();
      broadcastUpdate();
      setEditingWorkspaceId(null);
    },
  });


  const deleteWorkspace = trpc.workspace.delete.useMutation({
    onSuccess: () => {
      utils.workspace.list.invalidate();
      broadcastUpdate();
      if (selectedWorkspaceId) onSelect(""); // Deselect if current was deleted
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
    updateWorkspace.mutate({
      id: editingWorkspaceId,
      name: editingWorkspaceName.trim(),
    });
  };

  const handleDeleteWorkspace = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (
      confirm(
        "Are you sure you want to delete this workspace? All notes within it will be permanently removed."
      )
    ) {
      deleteWorkspace.mutate({ id });
    }
  };

  const startEditingWorkspace = (id: string, name: string) => {
    setEditingWorkspaceId(id);
    setEditingWorkspaceName(name);
  };

  return (
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
            className="border-border text-foreground focus:ring-accent/20 focus:border-accent w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-all focus:ring-2"
            onBlur={() => !newWorkspaceName && setIsCreating(false)}
          />
        </form>
      )}

      {isLoading ? (
        <p className="text-accent animate-pulse text-xs tracking-widest uppercase">
          Loading...
        </p>
      ) : workspaces?.length === 0 && !isCreating ? (
        <p className="text-accent text-xs">No workspaces found.</p>
      ) : (
        <ul className="space-y-1">
          {workspaces?.map(
            (ws: { id: string; name: string; ownerId: string }) => (
              <li key={ws.id} className="group relative">
                {editingWorkspaceId === ws.id ? (
                  <form onSubmit={handleRenameWorkspace} className="w-full">
                    <input
                      autoFocus
                      type="text"
                      value={editingWorkspaceName}
                      onChange={(e) => setEditingWorkspaceName(e.target.value)}
                      className="border-border text-foreground focus:ring-accent/20 focus:border-accent w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-all focus:ring-2"
                      onBlur={() =>
                        handleRenameWorkspace(new Event("submit") as any)
                      }
                    />
                  </form>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => onSelect(ws.id)}
                      onDoubleClick={() =>
                        startEditingWorkspace(ws.id, ws.name)
                      }
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                        selectedWorkspaceId === ws.id
                          ? "bg-accent text-white font-medium shadow-sm"
                          : "text-slate-600 hover:bg-accent/5 hover:text-accent border-transparent"
                      }`}
                    >
                      {ws.name}
                    </button>
                    <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingWorkspace(ws.id, ws.name);
                        }}
                        className={`p-1 transition-colors ${
                          selectedWorkspaceId === ws.id
                            ? "text-white/80 hover:text-white"
                            : "text-slate-400 hover:text-accent"
                        }`}
                        title="Rename"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>

                      {ws.ownerId === session?.user?.id && (
                        <button
                          onClick={(e) => handleDeleteWorkspace(e, ws.id)}
                          className={`p-1 transition-colors ${
                            selectedWorkspaceId === ws.id
                              ? "text-white/80 hover:text-white"
                              : "text-slate-400 hover:text-red-500"
                          }`}
                          title="Delete Workspace"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
