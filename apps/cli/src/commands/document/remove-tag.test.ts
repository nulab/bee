import consola from "consola";
import { describe, expect, it, vi } from "vite-plus/test";
import { mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({});
const { removeDocumentTags } = vi.hoisted(() => ({ removeDocumentTags: vi.fn() }));

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
  removeDocumentTags,
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("document remove-tag", () => {
  it("removes every given tag from the document", async () => {
    vi.mocked(removeDocumentTags).mockResolvedValue(undefined);

    await parseCommand(() => import("./remove-tag"), ["doc-1", "draft", "wip"]);

    expect(removeDocumentTags).toHaveBeenCalledWith(mockClient, "doc-1", ["draft", "wip"]);
    expect(consola.success).toHaveBeenCalledWith("Removed tags draft, wip from document doc-1");
  });

  it("uses the singular noun when removing one tag", async () => {
    vi.mocked(removeDocumentTags).mockResolvedValue(undefined);

    await parseCommand(() => import("./remove-tag"), ["doc-1", "draft"]);

    expect(consola.success).toHaveBeenCalledWith("Removed tag draft from document doc-1");
  });
});
