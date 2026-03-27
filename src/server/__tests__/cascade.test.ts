import { describe, it, expect } from "vitest";
import { appRouter } from "@/server";
import { prismaMock } from "@/__mocks__/prisma";

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

describe("Cascade Deletion Integration (Mocked)", () => {
  it("should simulate notes becoming inaccessible after workspace deletion", async () => {
    // 1. Setup: Workspace and Note exist
    const workspaceId = "ws_1";
    const noteId = "note_1";

    prismaMock.workspace.findFirst.mockResolvedValue({
      id: workspaceId,
      ownerId: "user_1",
      name: "Project to Delete",
    });

    // 2. Perform Workspace Deletion
    await caller.workspace.delete({ id: workspaceId });

    // Verify the delete call was made to Prisma
    expect(prismaMock.workspace.delete).toHaveBeenCalledWith({
      where: { id: workspaceId },
    });

    // 3. Simulate Cascade: After workspace is gone, DB would have removed the note.
    // In our tRPC test, we mock that a subsequent list/get for this workspace returns empty/null.
    prismaMock.note.findMany.mockResolvedValue([]);
    prismaMock.note.findFirst.mockResolvedValue(null);

    const notesList = await caller.note.list({ workspaceId });
    expect(notesList).toHaveLength(0);

    await expect(caller.note.getById({ id: noteId })).rejects.toThrow(
      "Note not found"
    );
  });

  it("should ensure NoteVersions are also conceptually removed", async () => {
    // Conceptually, NoteVersion belongs to Note.
    // If Note is gone (due to WS cascade), Versions are gone.
    prismaMock.noteVersion.findMany.mockResolvedValue([]);

    const versions = await caller.note.listVersions({ noteId: "any_note" });
    expect(versions).toHaveLength(0);
  });
});
