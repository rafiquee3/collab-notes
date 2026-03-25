"use client";

import React from "react";
import { trpc } from "@/utils/trpc";
import { format } from "date-fns";

export function VersionHistory({
  noteId,
  onRestore,
  onClose,
}: {
  noteId: string;
  onRestore: (content: any) => void;
  onClose: () => void;
}) {
  const { data: versions, isLoading } = trpc.note.listVersions.useQuery({
    noteId,
  });

  const handleRestore = (version: any) => {
    if (
      window.confirm(
        "Are you sure you want to restore this version? This will instantly replace the current note content for all users."
      )
    ) {
      onRestore(version.content);
      onClose();
    }
  };

  return (
    <div className="bg-surface border-border flex w-80 flex-col border-l shadow-2xl transition-all duration-300">
      <div className="border-border flex items-center justify-between border-b px-6 py-4">
        <h3 className="text-foreground font-serif text-lg font-medium">
          Version History
        </h3>
        <button
          onClick={onClose}
          className="text-accent hover:text-foreground transition-colors"
          title="Close History"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-accent animate-pulse text-sm">
            Loading history...
          </div>
        ) : !versions || versions.length === 0 ? (
          <div className="text-accent text-sm">No saved versions found.</div>
        ) : (
          <div className="space-y-4">
            {versions.map((version: any) => (
              <div
                key={version.id}
                className="border-border hover:border-accent bg-background group relative rounded-lg border p-4 transition-colors"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="text-foreground text-sm font-medium">
                      {format(new Date(version.createdAt), "MMM d, yyyy")}
                    </div>
                    <div className="text-accent text-xs">
                      {format(new Date(version.createdAt), "h:mm a")}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => handleRestore(version)}
                    className="bg-foreground text-surface hover:bg-foreground/90 w-full rounded py-1.5 text-xs font-medium transition-colors"
                  >
                    Restore Version
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
