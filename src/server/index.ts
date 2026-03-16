import { z } from "zod";
import { router, publicProcedure } from "./trpc";

export const appRouter = router({
  // This is your first endpoint: "getUser"
  getUser: publicProcedure
    .input(z.string()) // Validation: endpoint accepts a string (e.g. ID)
    .query(async (opts) => {
      const { input } = opts;
      // Here you would normally use e.g. Prisma: prisma.user.findUnique(...)
      return { id: input, name: `User ${input}` };
    }),
  userList: publicProcedure.query(async () => {
    // Return a dummy list for now
    return [
      { id: "1", name: "User 1" },
      { id: "2", name: "User 2" },
    ];
  }),
});

// Export the router type so the frontend can "see" it
export type AppRouter = typeof appRouter;
