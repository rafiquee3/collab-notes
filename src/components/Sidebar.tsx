"use client";

import { useState } from "react";
import { UserInfo, SignOutButton } from "./sidebar/UserInfo";
import { WorkspaceList } from "./sidebar/WorkspaceList";
import { NoteList } from "./sidebar/NoteList";

export function Sidebar({
  activeNoteId,
  onNoteSelect,
}: {
  activeNoteId?: string | null;
  onNoteSelect: (id: string) => void;
}) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(
    null
  );

  return (
    <aside className="border-border bg-surface m-3 flex w-72 flex-col rounded-2xl border shadow-sm">
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
  );
}
