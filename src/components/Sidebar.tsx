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
    <aside className="border-border bg-background flex min-h-screen w-72 flex-col border-r">
      <div className="flex-1 overflow-y-auto p-6">
        <UserInfo />

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

      <SignOutButton />
    </aside>
  );
}
