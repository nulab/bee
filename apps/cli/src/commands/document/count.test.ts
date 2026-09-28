import consola from "consola";
import { describe, expect, it, vi } from "vite-plus/test";
import { itOutputsJson, mockGetClient, parseCommand, setupCommandTest } from "@repo/test-utils";

const { mockClient, host } = setupCommandTest({});
const { getDocumentsCount } = vi.hoisted(() => ({ getDocumentsCount: vi.fn() }));

vi.mock("@repo/backlog-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  ...mockGetClient(mockClient, host),
  getDocumentsCount,
}));
vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("document count", () => {
  it("displays the number of documents in the project", async () => {
    vi.mocked(getDocumentsCount).mockResolvedValue({ count: 11 });

    await parseCommand(() => import("./count"), ["-p", "TEST"]);

    expect(getDocumentsCount).toHaveBeenCalledWith(mockClient, "TEST");
    expect(consola.log).toHaveBeenCalledWith("11");
  });

  it(
    "outputs JSON when --json flag is set",
    itOutputsJson(
      () => import("./count"),
      ["-p", "TEST", "--json"],
      "11",
      () => {
        vi.mocked(getDocumentsCount).mockResolvedValue({ count: 11 });
      },
    ),
  );
});
