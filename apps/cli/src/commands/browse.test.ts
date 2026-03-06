import { openUrl } from "@repo/backlog-utils";
import consola from "consola";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/backlog-utils", () => ({
  getClient: vi.fn(() => Promise.resolve({ client: {}, host: "example.backlog.com" })),
  openUrl: vi.fn(),
  issueUrl: vi.fn((host: string, key: string) => `https://${host}/view/${key}`),
  projectUrl: vi.fn((host: string, key: string) => `https://${host}/projects/${key}`),
  dashboardUrl: vi.fn((host: string) => `https://${host}/dashboard`),
  buildBacklogUrl: vi.fn((host: string, path: string) => `https://${host}${path}`),
}));

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

describe("browse", () => {
  it("opens dashboard when no arguments", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: {} } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/dashboard");
    expect(consola.info).toHaveBeenCalledWith(
      "Opening https://example.backlog.com/dashboard in your browser.",
    );
  });

  it("opens issue page for issue key target", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { target: "PROJ-123" } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/view/PROJ-123");
  });

  it("opens project page for project key", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { target: "MYPROJECT" } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/projects/MYPROJECT");
  });

  it("opens issues page with --issues flag", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { project: "PROJ", issues: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/find/PROJ");
  });

  it("opens board page with --board flag", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { project: "PROJ", board: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/board/PROJ");
  });

  it("opens gantt page with --gantt flag", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { project: "PROJ", gantt: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/gantt/PROJ");
  });

  it("opens wiki page with --wiki flag", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { project: "PROJ", wiki: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/wiki/PROJ");
  });

  it("opens documents page with --documents flag", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { project: "PROJ", documents: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/document/PROJ");
  });

  it("opens shared files page with --files flag", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { project: "PROJ", files: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/file/PROJ");
  });

  it("opens git page with --git flag", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { project: "PROJ", git: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/git/PROJ");
  });

  it("opens svn page with --svn flag", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { project: "PROJ", svn: true } } as never);

    expect(openUrl).toHaveBeenCalledWith("https://example.backlog.com/subversion/PROJ");
  });

  it("opens settings page with --settings flag", async () => {
    const { browse } = await import("./browse");
    await browse.run?.({ args: { project: "PROJ", settings: true } } as never);

    expect(openUrl).toHaveBeenCalledWith(
      "https://example.backlog.com/EditProject.action?project.id=PROJ",
    );
  });
});
