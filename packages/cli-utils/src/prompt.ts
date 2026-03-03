import { isNoInput } from "#/argv.js";
import consola from "consola";

const promptRequired = async (
  label: string,
  existing?: string,
  options?: { placeholder?: string },
): Promise<string> => {
  if (existing !== undefined) {
    if (existing) {
      return existing;
    }
    consola.error(`${label.replace(/:$/, "")} is required.`);
    return process.exit(1);
  }

  if (isNoInput()) {
    consola.error(
      `${label.replace(/:$/, "")} is required. Use arguments to provide it in --no-input mode.`,
    );
    return process.exit(1);
  }

  const value = await consola.prompt(label, { type: "text", ...options });

  if (typeof value !== "string" || !value) {
    consola.error(`${label.replace(/:$/, "")} is required.`);
    return process.exit(1);
  }

  return value;
};

const confirmOrExit = async (message: string, skipConfirm?: boolean): Promise<boolean> => {
  if (skipConfirm) {
    return true;
  }

  if (isNoInput()) {
    consola.error("Confirmation required. Use --yes to skip in --no-input mode.");
    return process.exit(1);
  }

  const confirmed = await consola.prompt(message, { type: "confirm" });

  if (!confirmed) {
    consola.info("Cancelled.");
    return false;
  }

  return true;
};

export { promptRequired, confirmOrExit };
