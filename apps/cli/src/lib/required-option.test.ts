import { Command } from "commander";
import { describe, expect, it, vi } from "vitest";
import { RequiredOption, resolveOptions } from "./required-option";

vi.mock("@repo/cli-utils", async (importOriginal) => ({
  ...(await importOriginal()),
  promptRequired: vi.fn(),
}));

describe("RequiredOption", () => {
  it("appends (required) to description", () => {
    const opt = new RequiredOption("-t, --title <title>", "Issue title");
    expect(opt.description).toBe("Issue title (required)");
  });

  it("uses custom promptLabel", () => {
    const opt = new RequiredOption("-t, --title <title>", "Issue title", "Summary");
    expect(opt.promptLabel).toBe("Summary");
  });

  it("defaults promptLabel to description", () => {
    const opt = new RequiredOption("-t, --title <title>", "Issue title");
    expect(opt.promptLabel).toBe("Issue title");
  });
});

describe("resolveOptions", () => {
  it("calls promptRequired for missing RequiredOption", async () => {
    const { promptRequired } = await import("@repo/cli-utils");
    vi.mocked(promptRequired).mockResolvedValueOnce("prompted-value");

    const cmd = new Command("test")
      .addOption(new RequiredOption("-t, --title <title>", "Issue title"))
      .action(() => {});

    // parse with no args — title is undefined
    cmd.parse([], { from: "user" });
    await resolveOptions(cmd);

    expect(promptRequired).toHaveBeenCalledWith("Issue title:", undefined);
    expect(cmd.opts().title).toBe("prompted-value");
  });

  it("passes existing value to promptRequired", async () => {
    const { promptRequired } = await import("@repo/cli-utils");
    vi.mocked(promptRequired).mockResolvedValueOnce("existing");

    const cmd = new Command("test")
      .addOption(new RequiredOption("-t, --title <title>", "Issue title"))
      .action(() => {});

    cmd.parse(["--title", "existing"], { from: "user" });
    await resolveOptions(cmd);

    expect(promptRequired).toHaveBeenCalledWith("Issue title:", "existing");
    expect(cmd.opts().title).toBe("existing");
  });

  it("ignores non-RequiredOption options", async () => {
    const { promptRequired } = await import("@repo/cli-utils");

    const cmd = new Command("test").option("-d, --desc <text>", "Description").action(() => {});

    cmd.parse([], { from: "user" });
    await resolveOptions(cmd);

    expect(promptRequired).not.toHaveBeenCalled();
  });

  it("resolves multiple RequiredOptions in definition order", async () => {
    const { promptRequired } = await import("@repo/cli-utils");
    const callOrder: string[] = [];

    vi.mocked(promptRequired)
      .mockImplementationOnce(async (label) => {
        callOrder.push(label as string);
        return "first-value";
      })
      .mockImplementationOnce(async (label) => {
        callOrder.push(label as string);
        return "second-value";
      })
      .mockImplementationOnce(async (label) => {
        callOrder.push(label as string);
        return "third-value";
      });

    const cmd = new Command("test")
      .addOption(new RequiredOption("-t, --title <title>", "Title"))
      .addOption(new RequiredOption("-d, --description <desc>", "Description"))
      .addOption(new RequiredOption("-p, --priority <priority>", "Priority"))
      .action(() => {});

    cmd.parse([], { from: "user" });
    await resolveOptions(cmd);

    expect(callOrder).toEqual(["Title:", "Description:", "Priority:"]);
    expect(cmd.opts().title).toBe("first-value");
    expect(cmd.opts().description).toBe("second-value");
    expect(cmd.opts().priority).toBe("third-value");
  });

  it("propagates error when promptRequired throws", async () => {
    const { promptRequired } = await import("@repo/cli-utils");
    const error = new Error("prompt cancelled");
    vi.mocked(promptRequired).mockRejectedValueOnce(error);

    const cmd = new Command("test")
      .addOption(new RequiredOption("-t, --title <title>", "Issue title"))
      .action(() => {});

    cmd.parse([], { from: "user" });
    await expect(resolveOptions(cmd)).rejects.toThrow("prompt cancelled");
  });
});
