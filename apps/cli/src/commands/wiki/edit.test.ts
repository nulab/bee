import { resolveStdinArg } from "@repo/cli-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

const mockClient = {
  patchWiki: vi.fn(),
};

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: mockClient, host: "example.backlog.com" })),
}));

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  resolveStdinArg: vi.fn((v: string | undefined) => Promise.resolve(v)),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("wiki edit", () => {
  it("updates wiki page name", async () => {
    mockClient.patchWiki.mockResolvedValue({ id: 123, name: "New Name" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { wiki: "123", name: "New Name" } } as never);

    expect(mockClient.patchWiki).toHaveBeenCalledWith(123, {
      name: "New Name",
      content: undefined,
      mailNotify: undefined,
    });
    expect(consola.success).toHaveBeenCalledWith("Updated wiki page 123: New Name");
  });

  it("updates wiki page body", async () => {
    mockClient.patchWiki.mockResolvedValue({ id: 123, name: "Page" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { wiki: "123", body: "New content" } } as never);

    expect(mockClient.patchWiki).toHaveBeenCalledWith(123, {
      name: undefined,
      content: "New content",
      mailNotify: undefined,
    });
  });

  it("reads body from stdin when piped", async () => {
    vi.mocked(resolveStdinArg).mockResolvedValueOnce("Stdin content");
    mockClient.patchWiki.mockResolvedValue({ id: 123, name: "Page" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { wiki: "123", body: "" } } as never);

    expect(resolveStdinArg).toHaveBeenCalledWith("");
    expect(mockClient.patchWiki).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ content: "Stdin content" }),
    );
  });

  it("passes notify flag", async () => {
    mockClient.patchWiki.mockResolvedValue({ id: 123, name: "Page" });

    const { edit } = await import("./edit");
    await edit.run?.({ args: { wiki: "123", name: "Page", "mail-notify": true } } as never);

    expect(mockClient.patchWiki).toHaveBeenCalledWith(
      123,
      expect.objectContaining({ mailNotify: true }),
    );
  });

  it("outputs JSON when --json flag is set", async () => {
    mockClient.patchWiki.mockResolvedValue({ id: 123, name: "Page" });

    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    const { edit } = await import("./edit");
    await edit.run?.({ args: { wiki: "123", name: "Page", json: "" } } as never);

    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("Page"));
    writeSpy.mockRestore();
  });
});
