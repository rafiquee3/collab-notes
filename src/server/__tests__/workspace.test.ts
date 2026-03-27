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

describe("workspaceRouter", () => {
  it("should create a highly mockable workspace", async () => {
    prismaMock.workspace.create.mockResolvedValue({
      id: "ws_1",
      name: "New Project",
      ownerId: "user_1",
    });

    const result = await caller.workspace.create({ name: "New Project" });

    expect(prismaMock.workspace.create).toHaveBeenCalledWith({
      data: {
        name: "New Project",
        ownerId: "user_1",
      },
    });
    expect(result).toHaveProperty("id", "ws_1");
    expect(result).toHaveProperty("name", "New Project");
  });

  it("should throw error if workspace name is empty", async () => {
    await expect(caller.workspace.create({ name: "" }))
      .rejects.toThrow();
  });

  it("should throw error if workspace name contains only whitespace", async () => {
    await expect(caller.workspace.create({ name: "   " }))
      .rejects.toThrow();
  });

  it("should list workspaces belonging to user", async () => {
    prismaMock.workspace.findMany.mockResolvedValue([
      { id: "ws_1", name: "Ws 1", ownerId: "user_1" },
      { id: "ws_2", name: "Ws 2", ownerId: "user_1" },
    ]);

    const result = await caller.workspace.list();

    expect(prismaMock.workspace.findMany).toHaveBeenCalledWith({
      include: {
        _count: {
          select: { notes: true },
        },
      },
    });
    expect(result).toHaveLength(2);
  });

  it("should delete workspace if user is the owner", async () => {
    // 1. Mock finding the workspace (authorized)
    prismaMock.workspace.findFirst.mockResolvedValue({
      id: "ws_1",
      name: "My Project",
      ownerId: "user_1",
    });

    // 2. Mock deletion
    prismaMock.workspace.delete.mockResolvedValue({
      id: "ws_1",
      name: "My Project",
      ownerId: "user_1",
    });

    const result = await caller.workspace.delete({ id: "ws_1" });

    expect(prismaMock.workspace.findFirst).toHaveBeenCalledWith({
      where: {
        id: "ws_1",
        ownerId: "user_1",
      },
    });
    expect(prismaMock.workspace.delete).toHaveBeenCalledWith({
      where: { id: "ws_1" },
    });
    expect(result).toEqual({ success: true });
  });

  it("should throw error if user is not the owner during deletion", async () => {
    // Mock finding none (unauthorized)
    prismaMock.workspace.findFirst.mockResolvedValue(null);

    await expect(caller.workspace.delete({ id: "ws_other" }))
      .rejects.toThrow("Workspace not found or unauthorized");
  });
});
