"use client";

import { useState } from "react";
import { UserInfo, SignOutButton } from "./sidebar/UserInfo";
import { WorkspaceList } from "./sidebar/WorkspaceList";
import { NoteList } from "./sidebar/NoteList";

export function Sidebar({
  activeNoteId,
  onNoteSelect,
  isOpen,
  onClose,
}: {
  activeNoteId?: string | null;
  onNoteSelect: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`border-border bg-surface flex flex-col border shadow-sm transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } fixed inset-y-0 left-0 z-50 w-72 md:m-3 md:rounded-2xl`}>
        <div className="flex-1 overflow-y-auto px-6 py-8">
        <UserInfo />

        <div className="mt-8 space-y-8">
          <WorkspaceList
            selectedWorkspaceId={selectedWorkspaceId}
            onSelect={setSelectedWorkspaceId}
          />

          {selectedWorkspaceId && (
            <NoteList
              selectedWorkspaceId={selectedWorkspaceId}
              activeNoteId={activeNoteId}
              onNoteSelect={onNoteSelect}
            />
          )}
        </div>
      </div>

      <SignOutButton />
      </aside>
    </>
  );
}
