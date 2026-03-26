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
});
