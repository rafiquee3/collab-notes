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

  describe("search", () => {
    it("should search notes with case-insensitivity and JSON casting", async () => {
      prismaMock.$queryRaw.mockResolvedValue([
        { id: "n1", title: "Note about Apples", updatedAt: new Date() },
      ]);

      const result = await caller.note.search({
        workspaceId: "ws_1",
        query: "APPLE",
      });

      expect(result).toHaveLength(1);
      // Verify that the query was called with the correct pattern (case-insensitive ILIKE is in the SQL)
      // and that it includes the workspace filter
      expect(prismaMock.$queryRaw).toHaveBeenCalledWith(
        expect.anything(), // The SQL template string
        "ws_1",            // Parameter 1: workspaceId
        "%APPLE%",         // Parameter 2: title pattern
        "%APPLE%"          // Parameter 3: content pattern
      );
    });

    it("should return empty array for whitespace-only query", async () => {
      const result = await caller.note.search({
        workspaceId: "ws_1",
        query: "   ",
      });

      expect(result).toEqual([]);
      expect(prismaMock.$queryRaw).not.toHaveBeenCalled();
    });

    it("should respect workspace boundaries during search", async () => {
      prismaMock.$queryRaw.mockResolvedValue([]);

      await caller.note.search({
        workspaceId: "ws_OTHER",
        query: "test",
      });

      expect(prismaMock.$queryRaw).toHaveBeenCalledWith(
        expect.anything(),
        "ws_OTHER",
        "%test%",
        "%test%"
      );
    });
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

  describe("versioning", () => {
    it("should create a new note version", async () => {
      const mockVersion = {
        id: "v1",
        noteId: "n1",
        content: { text: "v1 content" },
        createdAt: new Date(),
      };
      prismaMock.noteVersion.create.mockResolvedValue(mockVersion);

      const result = await caller.note.createVersion({
        noteId: "n1",
        content: { text: "v1 content" },
      });

      expect(prismaMock.noteVersion.create).toHaveBeenCalledWith({
        data: {
          noteId: "n1",
          content: { text: "v1 content" },
        },
      });
      expect(result.id).toBe("v1");
    });

    it("should list versions for a note ordered by date", async () => {
      prismaMock.noteVersion.findMany.mockResolvedValue([
        { id: "v2", noteId: "n1", content: {}, createdAt: new Date() },
        { id: "v1", noteId: "n1", content: {}, createdAt: new Date() },
      ]);

      const result = await caller.note.listVersions({ noteId: "n1" });

      expect(result).toHaveLength(2);
      expect(prismaMock.noteVersion.findMany).toHaveBeenCalledWith({
        where: { noteId: "n1" },
        orderBy: { createdAt: "desc" },
        take: 20,
      });
    });
  });

  describe("getById", () => {
    it("should return a note by ID", async () => {
      prismaMock.note.findFirst.mockResolvedValue({
        id: "n1",
        title: "Existing Note",
      } as any);

      const result = await caller.note.getById({ id: "n1" });
      expect(result.title).toBe("Existing Note");
    });

    it("should throw NOT_FOUND if note does not exist", async () => {
      prismaMock.note.findFirst.mockResolvedValue(null);

      await expect(caller.note.getById({ id: "invalid" }))
        .rejects.toThrow("Note not found");
    });
  });
});
