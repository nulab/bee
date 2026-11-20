import consola from "consola";
import { describe, expect, it, vi } from "vite-plus/test";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({});
const { addDocumentTags } = vi.hoisted(() => ({ addDocumentTags: vi.fn() }));

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
  addDocumentTags,
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

const sampleTags = [
  { id: 11, name: "spec" },
  { id: 12, name: "draft" },
];

describe("document add-tag", () => {
  it("adds every given tag to the document", async () => {
    vi.mocked(addDocumentTags).mockResolvedValue(sampleTags);

    await parseCommand(() => import("./add-tag"), ["doc-1", "spec", "draft"]);

    expect(addDocumentTags).toHaveBeenCalledWith(mockClient, "doc-1", ["spec", "draft"]);
    expect(consola.success).toHaveBeenCalledWith("Added tags spec, draft to document doc-1");
  });

  it("uses the singular noun when adding one tag", async () => {
    vi.mocked(addDocumentTags).mockResolvedValue([sampleTags[0]]);

    await parseCommand(() => import("./add-tag"), ["doc-1", "spec"]);

    expect(consola.success).toHaveBeenCalledWith("Added tag spec to document doc-1");
  });

  it(
    "outputs the tags given on the command line as JSON when --json flag is set",
    itOutputsJson(
      () => import("./add-tag"),
      ["doc-1", "spec", "--json"],
      "spec",
      () => {
        vi.mocked(addDocumentTags).mockResolvedValue([sampleTags[0]]);
      },
    ),
  );
});
