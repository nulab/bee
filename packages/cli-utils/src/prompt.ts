import consola from "consola";
import { UserError } from "./user-error";

const promptRequired = async (
  label: string,
  existing?: string,
  options?: { placeholder?: string; valueHint?: string },
): Promise<string> => {
  if (existing !== undefined) {
    if (existing) {
      return existing;
    }
    throw new UserError(`${label.replace(/:$/, "")} is required.`);
  }

  if (!process.stdin.isTTY) {
    throw new UserError(
      `${label.replace(/:$/, "")} is required. Use arguments to provide it in non-interactive mode.`,
    );
  }

  const displayLabel = options?.valueHint ? label.replace(/:$/, ` ${options.valueHint}:`) : label;
  const { valueHint: _, ...promptOptions } = options ?? {};

  const value = await consola.prompt(displayLabel, { type: "text", ...promptOptions });

  if (typeof value !== "string" || !value) {
    throw new UserError(`${label.replace(/:$/, "")} is required.`);
  }

  return value;
};

const confirmOrExit = async (message: string, skipConfirm?: boolean): Promise<boolean> => {
  if (skipConfirm) {
    return true;
  }

  if (!process.stdin.isTTY) {
    throw new UserError("Confirmation required. Use --yes to skip in non-interactive mode.");
  }

  const confirmed = await consola.prompt(message, { type: "confirm" });

  if (!confirmed) {
    consola.info("Cancelled.");
    return false;
  }

  return true;
};

export { promptRequired, confirmOrExit };
