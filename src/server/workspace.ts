import { z } from "zod";
import { router, protectedProcedure } from "./trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const workspaceRouter = router({
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { name } = input;
      const { session } = ctx;

      const workspace = await prisma.workspace.create({
        data: {
          name,
          ownerId: session.user.id,
        },
      });

      return workspace;
    }),
  list: protectedProcedure.query(async ({ ctx }) => {
    const workspaces = await prisma.workspace.findMany({
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });

    return workspaces;
  }),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { session } = ctx;

      // Ensure the user owns the workspace before deleting
      const workspace = await prisma.workspace.findFirst({
        where: {
          id,
          ownerId: session.user.id,
        },
      });

      if (!workspace) {
        throw new Error("Workspace not found or unauthorized");
      }

      await prisma.workspace.delete({
        where: { id },
      });

      return { success: true };
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id, name } = input;
      const { session } = ctx;

      const workspace = await prisma.workspace.findFirst({
        where: {
          id,
          ownerId: session.user.id,
        },
      });

      if (!workspace) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Workspace not found or unauthorized",
        });
      }

      const updatedWorkspace = await prisma.workspace.update({
        where: { id },
        data: { name },
      });

      return updatedWorkspace;
    }),
});
