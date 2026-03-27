"use client";
import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { trpc } from "@/utils/trpc";
import { Sidebar } from "@/components/Sidebar";
import { Editor } from "@/components/Editor";

export default function Home() {
  const { data: session } = useSession();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-8">
        <div className="text-center">
          <h1 className="mb-4 font-serif text-5xl lg:text-7xl">CollabNotes</h1>
          <p className="text-accent mb-8 text-sm tracking-widest uppercase">
            Studio Environment
          </p>
        </div>
        <button onClick={() => signIn()} className="studio-button">
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bg-background flex h-screen overflow-hidden">
      <Sidebar activeNoteId={activeNoteId} onNoteSelect={setActiveNoteId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeNoteId ? (
          <Editor key={activeNoteId} noteId={activeNoteId} />
        ) : (
          <div className="flex h-full flex-col p-8 lg:px-20 lg:py-12">
            <header className="mb-16 flex items-baseline justify-between">
              <div>
                <h1 className="text-foreground text-5xl font-bold tracking-tight lg:text-6xl">
                  Your Workspace
                </h1>
                <div className="flex flex-col gap-1 mt-3">
                  <p className="text-slate-400 text-xs font-semibold tracking-widest uppercase">
                    {new Date().toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                  <p className="text-accent/60 text-[10px] font-bold tracking-[0.3em] uppercase">
                    Select a note to begin
                  </p>
                </div>
              </div>
            </header>
          </div>
        )}
      </div>
    </div>
  );
}
