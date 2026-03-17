"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { trpc } from "@/utils/trpc";

export default function Home() {
  const { data: session } = useSession();
  const { data, isLoading } = trpc.getUser.useQuery("User123");

  if (isLoading)
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="text-accent animate-pulse font-serif text-2xl tracking-widest uppercase">
          Loading...
        </div>
      </div>
    );

  return (
    <div className="bg-background min-h-screen p-8 lg:p-16">
      {/* Header */}
      <header className="border-border mb-16 flex items-baseline justify-between border-b pb-8">
        <div>
          <h1 className="text-5xl lg:text-7xl">Your Workspace</h1>
          <p className="text-accent mt-2 text-sm tracking-widest uppercase">
            {new Date().toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex gap-4">
          {session ? (
            <div className="flex items-center gap-6">
              <span className="text-accent text-xs tracking-tighter uppercase">
                {session.user?.email}
              </span>
              <button onClick={() => signOut()} className="studio-button">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => signIn()} className="studio-button">
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"></main>
    </div>
  );
}
