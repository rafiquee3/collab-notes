"use client";

import { useSession, signOut } from "next-auth/react";

export function UserInfo() {
  const { data: session } = useSession();

  return (
    <div className="mb-12 flex items-center gap-4">
      <div className="border-border bg-border/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-xs tracking-widest uppercase">
        {session?.user?.name?.charAt(0) ||
          session?.user?.email?.charAt(0) ||
          "U"}
      </div>
      <div className="flex-1 overflow-hidden">
        <h2 className="text-foreground truncate text-sm font-bold">
          {session?.user?.name || "Anonymous"}
        </h2>
        <p className="text-accent truncate text-xs">
          {session?.user?.email}
        </p>
      </div>
    </div>
  );
}

export function SignOutButton() {
  return (
    <div className="border-border mt-auto border-t p-6">
      <button
        onClick={() => signOut()}
        className="text-accent hover:text-foreground w-full text-left text-xs tracking-widest uppercase transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
