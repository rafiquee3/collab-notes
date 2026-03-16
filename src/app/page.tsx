"use client";

import { trpc } from "@/utils/trpc";

export default function Home() {
  const { data, isLoading } = trpc.getUser.useQuery("User123");

  console.log("user:", data);
  if (isLoading) return <div>isLoading</div>;
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between bg-white px-16 py-32 sm:items-start dark:bg-black">
        <div>Hello Word - sdqqdsqs {data.name}</div>
      </main>
    </div>
  );
}
