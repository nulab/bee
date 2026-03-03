export type ExtractedArgs = {
  space: string | undefined;
  noInput: boolean;
  argv: string[];
};

export function extractGlobalArgs(argv: string[]): ExtractedArgs {
  const result: string[] = [];
  let space: string | undefined;
  let noInput = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] as string;

    if (arg === "--space" || arg === "-s") {
      space = argv[++i];
    } else if (arg.startsWith("--space=")) {
      space = arg.slice("--space=".length);
    } else if (arg.startsWith("-s=")) {
      space = arg.slice("-s=".length);
    } else if (arg === "--no-input") {
      noInput = true;
    } else {
      result.push(arg);
    }
  }

  return { space, noInput, argv: result };
}

export function isNoInput(): boolean {
  return process.env["BACKLOG_NO_INPUT"] === "1";
}
