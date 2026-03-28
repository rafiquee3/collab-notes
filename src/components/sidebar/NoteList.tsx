"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { useSession } from "next-auth/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useEffect, useRef } from "react";

interface NoteListProps {
  selectedWorkspaceId: string;
  activeNoteId?: string | null;
  onNoteSelect: (id: string) => void;
}

export function NoteList({
  selectedWorkspaceId,
  activeNoteId,
  onNoteSelect,
}: NoteListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: session } = useSession();

  const utils = trpc.useUtils();
  const syncMapRef = useRef<Y.Map<any> | null>(null);

  useEffect(() => {
    if (!selectedWorkspaceId) return;

    const doc = new Y.Doc();
    const provider = new WebsocketProvider(
      process.env.NEXT_PUBLIC_COLLAB_SERVER_URL || "ws://localhost:1234",
      `workspace-sync-${selectedWorkspaceId}`,
      doc
    );
    
    const syncMap = doc.getMap("sync");
    syncMapRef.current = syncMap;

    const handleSync = () => {
      utils.note.list.invalidate({ workspaceId: selectedWorkspaceId });
    };

    syncMap.observe(handleSync);

    return () => {
      syncMap.unobserve(handleSync);
      provider.destroy();
      doc.destroy();
      syncMapRef.current = null;
    };
  }, [selectedWorkspaceId, utils]);

  const broadcastUpdate = () => {
    syncMapRef.current?.set("lastUpdate", Date.now());
  };

  const { data: notes, isLoading } = trpc.note.list.useQuery(
    { workspaceId: selectedWorkspaceId },
    { enabled: !!selectedWorkspaceId && !searchQuery }
  );

  const { data: searchResults, isLoading: isSearching } = trpc.note.search.useQuery(
    { workspaceId: selectedWorkspaceId, query: searchQuery },
    { enabled: searchQuery.trim().length > 0 }
  );

  const createNote = trpc.note.create.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate({ workspaceId: selectedWorkspaceId });
      broadcastUpdate();
      setIsCreating(false);
      setNewNoteTitle("");
    },
  });


  const updateNote = trpc.note.update.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate({ workspaceId: selectedWorkspaceId });
      broadcastUpdate();
      setEditingNoteId(null);
    },
  });


  const deleteNote = trpc.note.delete.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate({ workspaceId: selectedWorkspaceId });
      utils.note.search.invalidate();
      broadcastUpdate();
    },
  });



  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    createNote.mutate({
      workspaceId: selectedWorkspaceId,
      title: newNoteTitle.trim(),
    });
  };

  const handleRenameNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNoteId || !editingNoteTitle.trim()) {
      setEditingNoteId(null);
      return;
    }
    updateNote.mutate({ id: editingNoteId, title: editingNoteTitle.trim() });
  };

  const startEditing = (id: string, currentTitle: string | null) => {
    setEditingNoteId(id);
    setEditingNoteTitle(currentTitle || "");
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this note?")) {
      deleteNote.mutate({ id });
    }
  };


  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="border-border text-foreground focus:ring-accent/20 focus:border-accent w-full rounded-xl border bg-surface px-3 py-2 pl-8 text-sm outline-none transition-all focus:ring-2 placeholder:text-slate-400"
          />
          <svg
            className="text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2"
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
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-accent hover:text-foreground absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-accent text-xs tracking-widest uppercase">
          {searchQuery ? "Search Results" : "Notes"}
        </h3>
        {!searchQuery && (
          <button
            onClick={() => setIsCreating(true)}
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
        )}
      </div>


      {isCreating && (
        <form onSubmit={handleCreateNote} className="mb-4">
          <input
            autoFocus
            type="text"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            placeholder="Note title..."
            className="border-border text-foreground focus:ring-accent/20 focus:border-accent w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-all focus:ring-2"
            onBlur={() => !newNoteTitle && setIsCreating(false)}
          />
        </form>
      )}

      {isLoading || isSearching ? (
        <p className="text-accent animate-pulse text-xs tracking-widest uppercase">
          {isSearching ? "Searching..." : "Loading..."}
        </p>
      ) : (searchQuery ? searchResults : notes)?.length === 0 && !isCreating ? (
        <p className="text-accent text-xs">
          {searchQuery ? "No results found." : "No notes found."}
        </p>
      ) : (
        <ul className="space-y-1">
          {(searchQuery ? searchResults : notes)?.map(
            (note: { id: string; title: string | null; authorId?: string | null }) => (
              <li key={note.id} className="group relative">
                {editingNoteId === note.id ? (
                  <form onSubmit={handleRenameNote} className="w-full">
                    <input
                      autoFocus
                      type="text"
                      value={editingNoteTitle}
                      onChange={(e) => setEditingNoteTitle(e.target.value)}
                      className="border-border text-foreground focus:ring-accent/20 focus:border-accent w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none transition-all focus:ring-2"
                      onBlur={() => handleRenameNote(new Event("submit") as any)}
                    />
                  </form>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => onNoteSelect(note.id)}
                      onDoubleClick={() => startEditing(note.id, note.title)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-all ${
                        activeNoteId === note.id
                          ? "bg-accent text-white font-medium shadow-sm"
                          : "text-slate-600 hover:bg-accent/5 hover:text-accent border-transparent"
                      }`}
                    >
                      {note.title || "Untitled"}
                    </button>
                    <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1 opacity-0 transition-all group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(note.id, note.title);
                        }}
                        className={`p-1 transition-colors ${
                          activeNoteId === note.id
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
                      
                      {note.authorId === session?.user?.id && (
                        <button
                          onClick={(e) => handleDelete(e, note.id)}
                          className={`p-1 transition-colors ${
                            activeNoteId === note.id
                              ? "text-white/80 hover:text-white"
                              : "text-slate-400 hover:text-red-500"
                          }`}
                          title="Delete Note"
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
