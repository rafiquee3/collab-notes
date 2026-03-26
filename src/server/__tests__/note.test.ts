import { describe, it, expect } from "vitest";
import { appRouter } from "@/server";
import { prismaMock } from "@/__mocks__/prisma";
import { TRPCError } from "@trpc/server";

const mockSession = {
  user: {
    id: "user_1",
    email: "test@example.com",
    name: "Test User",
  },
  expires: "9999-12-31T23:59:59.999Z",
};

const caller = appRouter.createCaller({
  session: mockSession,
});

describe("noteRouter", () => {
  it("should create a new note with default title if missing", async () => {
    prismaMock.note.create.mockResolvedValue({
      id: "note_1",
      workspaceId: "ws_1",
      title: "Untitled",
      content: null,
      authorId: null,
      updatedAt: new Date(),
      createdAt: new Date(),
    });

    const result = await caller.note.create({
      workspaceId: "ws_1",
    });

    expect(prismaMock.note.create).toHaveBeenCalledWith({
      data: {
        workspaceId: "ws_1",
        title: "Untitled",
        content: undefined,
        authorId: "user_1",
      },
    });
    expect(result.id).toBe("note_1");
  });

  it("should list notes for workspace", async () => {
    prismaMock.note.findMany.mockResolvedValue([
      {
        id: "n1",
        workspaceId: "ws_1",
        title: "Test 1",
        content: null,
        authorId: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      },
    ]);

    const result = await caller.note.list({ workspaceId: "ws_1" });
    expect(result).toHaveLength(1);
    expect(prismaMock.note.findMany).toHaveBeenCalledWith({
      where: { workspaceId: "ws_1" },
      orderBy: { updatedAt: "desc" },
    });
  });

  it("should search notes using raw SQL", async () => {
    // $queryRaw is a mock template literal function in vitest-mock-extended
    prismaMock.$queryRaw.mockResolvedValue([
      { id: "n1", title: "Found Note", updatedAt: new Date() },
    ]);

    const result = await caller.note.search({
      workspaceId: "ws_1",
      query: "hello",
    });

    expect(result).toHaveLength(1);
    expect(prismaMock.$queryRaw).toHaveBeenCalled();
  });

  it("should allow owner to delete a note", async () => {
    // Mock the findFirst dependency which checks ownership
    prismaMock.note.findFirst.mockResolvedValue({
      id: "note_1",
      workspaceId: "ws_1",
      title: "Title",
      content: null,
      authorId: "user_1",
      updatedAt: new Date(),
      createdAt: new Date(),
    });

    prismaMock.note.delete.mockResolvedValue({} as any);

    const result = await caller.note.delete({ id: "note_1" });
    
    expect(result.success).toBe(true);
    expect(prismaMock.note.delete).toHaveBeenCalledWith({ where: { id: "note_1" } });
  });

  it("should throw NOT_FOUND when deleting unauthorized note", async () => {
    // Returning null simulates note not found or belonging to someone else
    prismaMock.note.findFirst.mockResolvedValue(null);

    await expect(caller.note.delete({ id: "note_1" })).rejects.toThrowError(
      new TRPCError({ code: "UNAUTHORIZED", message: "Only the author can delete this note." })
    );
    expect(prismaMock.note.delete).not.toHaveBeenCalled();
  });
});
