type ExtractedArgs = {
  space: string | undefined;
  noInput: boolean;
  argv: string[];
};

const extractGlobalArgs = (argv: string[]): ExtractedArgs => {
  const result: string[] = [];
  let space: string | undefined;
  let noInput = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--space") {
      space = argv[++i];
    } else if (arg.startsWith("--space=")) {
      space = arg.slice("--space=".length);
    } else if (arg === "--no-input") {
      noInput = true;
    } else {
      result.push(arg);
    }
  }

  return { space, noInput, argv: result };
};

const isNoInput = (): boolean => process.env.BACKLOG_NO_INPUT === "1";

export type { ExtractedArgs };
export { extractGlobalArgs, isNoInput };
