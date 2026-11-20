import { describe, expect, it, vi } from "vite-plus/test";
import { type BacklogClient } from "./client";
import {
  addDocumentTags,
  getDocumentComments,
  getDocumentsCount,
  removeDocumentTags,
} from "./document-api";

const createMockClient = () =>
  ({
    get: vi.fn().mockResolvedValue(undefined),
    post: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  }) as unknown as BacklogClient & Record<"get" | "post" | "delete", ReturnType<typeof vi.fn>>;

describe("document API", () => {
  it("gets the comments of a document", async () => {
    const client = createMockClient();
    await getDocumentComments(client, "doc-1");
    expect(client.get).toHaveBeenCalledWith("documents/doc-1/comments");
  });

  it("counts documents of a project given by ID or key", async () => {
    const client = createMockClient();
    await getDocumentsCount(client, "PROJ");
    expect(client.get).toHaveBeenCalledWith("documents/count", { projectIdOrKey: "PROJ" });
  });

  it("adds tags as a tagNames array", async () => {
    const client = createMockClient();
    await addDocumentTags(client, "doc-1", ["spec", "draft"]);
    expect(client.post).toHaveBeenCalledWith("documents/doc-1/tags", {
      tagNames: ["spec", "draft"],
    });
  });

  it("removes tags as a tagNames array", async () => {
    const client = createMockClient();
    await removeDocumentTags(client, "doc-1", ["draft"]);
    expect(client.delete).toHaveBeenCalledWith("documents/doc-1/tags", { tagNames: ["draft"] });
  });
});
