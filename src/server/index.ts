import { z } from "zod";
import bcrypt from "bcryptjs";
import { router, publicProcedure } from "./trpc";
import { prisma } from "@/lib/prisma";
import { noteRouter } from "./note";
import { workspaceRouter } from "./workspace";

const registerSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const appRouter = router({
  getUser: publicProcedure.input(z.string()).query(async (opts) => {
    const { input } = opts;
    return { id: input, name: `User ${input}` };
  }),
  userList: publicProcedure.query(async () => {
    return [
      { id: "1", name: "User 1" },
      { id: "2", name: "User 2" },
    ];
  }),
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const { name, email, password } = input;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      return { id: user.id, email: user.email, name: user.name };
    }),
  note: noteRouter,
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
