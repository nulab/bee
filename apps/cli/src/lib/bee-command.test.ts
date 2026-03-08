import { Command, Option } from "commander";
import { describe, expect, it } from "vitest";
import { BeeCommand } from "./bee-command";

describe("BeeCommand", () => {
  describe("examples", () => {
    it("renders EXAMPLES section in help", () => {
      const cmd = new BeeCommand("test").examples([
        { description: "Run it", command: "bee test --foo" },
      ]);
      const help = cmd.helpInformation();
      expect(help).toContain("EXAMPLES");
      expect(help).toContain("# Run it");
      expect(help).toContain("$ bee test --foo");
    });
  });

  describe("envVars", () => {
    it("renders manual env vars in help", () => {
      const cmd = new BeeCommand("test").envVars([["MY_VAR", "Some description"]]);
      const help = cmd.helpInformation();
      expect(help).toContain("ENVIRONMENT VARIABLES");
      expect(help).toContain("MY_VAR");
      expect(help).toContain("Some description");
    });

    it("auto-collects env vars from options with .env()", () => {
      const cmd = new BeeCommand("test").addOption(
        new Option("-p, --project <id>", "Project ID").env("BACKLOG_PROJECT"),
      );
      const help = cmd.helpInformation();
      expect(help).toContain("BACKLOG_PROJECT");
      expect(help).toContain("Project ID");
    });

    it("merges auto-collected and manual env vars", () => {
      const cmd = new BeeCommand("test")
        .addOption(new Option("-p, --project <id>", "Project ID").env("BACKLOG_PROJECT"))
        .envVars([["BACKLOG_API_KEY", "API key"]]);
      const help = cmd.helpInformation();
      expect(help).toContain("BACKLOG_PROJECT");
      expect(help).toContain("BACKLOG_API_KEY");
    });
  });

  describe("addCommands", () => {
    it("adds commands from dynamic imports", async () => {
      const child = new Command("child").summary("A child");
      const parent = new BeeCommand("parent");
      await parent.addCommands([Promise.resolve({ default: child })]);
      expect(parent.commands.map((c) => c.name())).toContain("child");
    });
  });

  describe("createCommand", () => {
    it("returns BeeCommand instance", () => {
      const cmd = new BeeCommand("test");
      expect(cmd.createCommand("sub")).toBeInstanceOf(BeeCommand);
    });
  });
});
