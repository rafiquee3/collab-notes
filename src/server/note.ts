import { z } from "zod";
import { router, protectedProcedure } from "./trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

export const noteRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        workspaceId: z.string(),
        title: z.string().optional(),
        content: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { workspaceId, title, content } = input;

      const note = await prisma.note.create({
        data: {
          workspaceId,
          title: title || "Untitled",
          content,
        },
      });

      return note;
    }),

  list: protectedProcedure
    .input(z.object({ workspaceId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { workspaceId } = input;

      const notes = await prisma.note.findMany({
        where: { workspaceId },
        orderBy: { updatedAt: "desc" },
      });

      return notes;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { id } = input;

      const note = await prisma.note.findFirst({
        where: { id },
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found",
        });
      }

      return note;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().optional(),
        content: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, title, content } = input;

      const updatedNote = await prisma.note.update({
        where: { id },
        data: {
          title,
          content,
        },
      });

      return updatedNote;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;
      const { session } = ctx;

      // Verify ownership
      const note = await prisma.note.findFirst({
        where: {
          id,
          workspace: {
            ownerId: session.user.id,
          },
        },
      });

      if (!note) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Note not found or unauthorized",
        });
      }

      await prisma.note.delete({
        where: { id },
      });

      return { success: true };
    }),
});
