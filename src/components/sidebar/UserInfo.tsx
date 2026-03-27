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
    <div className="mt-auto px-6 pb-8">
      <div className="border-border border-t border-b py-4 flex items-center justify-center">
        <button
          onClick={() => signOut()}
          className="text-accent hover:text-foreground flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] uppercase transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Sign Out
        </button>
      </div>
    </div>
  );
}
