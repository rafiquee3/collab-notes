"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";

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

  const utils = trpc.useUtils();

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
      setIsCreating(false);
      setNewNoteTitle("");
    },
  });

  const updateNote = trpc.note.update.useMutation({
    onSuccess: () => {
      utils.note.list.invalidate({ workspaceId: selectedWorkspaceId });
      setEditingNoteId(null);
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

  return (
    <div>
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="border-border text-foreground focus:border-accent/50 w-full border bg-transparent px-3 py-2 pl-8 text-sm outline-none transition-all placeholder:text-accent/50"
          />
          <svg
            className="text-accent/50 absolute left-2.5 top-1/2 -translate-y-1/2"
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
            className="border-border text-foreground focus:border-accent/50 w-full border bg-transparent px-3 py-2 text-sm outline-none"
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
            (note: { id: string; title: string | null }) => (
              <li key={note.id} className="group relative">
                {editingNoteId === note.id ? (
                  <form onSubmit={handleRenameNote} className="w-full">
                    <input
                      autoFocus
                      type="text"
                      value={editingNoteTitle}
                      onChange={(e) => setEditingNoteTitle(e.target.value)}
                      className="border-border text-foreground focus:border-accent/50 w-full border bg-transparent px-3 py-2 text-sm outline-none"
                      onBlur={() => handleRenameNote(new Event("submit") as any)}
                    />
                  </form>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => onNoteSelect(note.id)}
                      onDoubleClick={() => startEditing(note.id, note.title)}
                      className={`text-accent group-hover:border-border group-hover:bg-border/10 group-hover:text-foreground w-full truncate border px-3 py-2 text-left text-sm transition-all transition-colors ${
                        activeNoteId === note.id
                          ? "border-border bg-border/20 text-foreground font-medium"
                          : "border-transparent"
                      }`}
                    >
                      {note.title || "Untitled"}
                    </button>
                    {!searchQuery && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(note.id, note.title);
                        }}
                        className="text-accent hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 p-1 opacity-0 transition-all group-hover:opacity-100"
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
                    )}
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
