"use client";

import { useSession, signIn } from "next-auth/react";
import { trpc } from "@/utils/trpc";
import { Sidebar } from "@/components/Sidebar";

export default function Home() {
  const { data: session } = useSession();
  const { isLoading } = trpc.getUser.useQuery("User123");

  if (isLoading)
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-accent animate-pulse font-serif text-2xl tracking-widest uppercase">
          Loading...
        </div>
      </div>
    );

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
      <Sidebar />
      <div className="min-h-screen flex-1 overflow-y-auto p-8 lg:p-16">
        {/* Header */}
        <header className="border-border mb-16 flex items-baseline justify-between border-b pb-8">
          <div>
            <h1 className="font-serif text-5xl lg:text-7xl">Your Workspace</h1>
            <p className="text-accent mt-2 text-sm tracking-widest uppercase">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </header>

        {/* Main Content Grid */}
        <main className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Notes or Editor will be rendered here based on selection */}
        </main>
      </div>
    </div>
  );
}
