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
    <div className="bg-background flex min-h-screen">
      <Sidebar activeNoteId={activeNoteId} onNoteSelect={setActiveNoteId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeNoteId ? (
          <Editor key={activeNoteId} noteId={activeNoteId} />
        ) : (
          <div className="flex h-full flex-col p-8 lg:p-16">
            <header className="border-border mb-16 flex items-baseline justify-between border-b pb-8">
              <div>
                <h1 className="font-serif text-5xl lg:text-7xl">
                  Your Workspace
                </h1>
                <p className="text-accent mt-2 text-sm tracking-widest uppercase">
                  {new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </header>
            <main className="flex flex-1 items-center justify-center">
              <div className="text-accent text-xs tracking-[0.3em] uppercase opacity-30">
                Select a note to begin
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
