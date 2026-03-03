import { vi } from "vitest";

export const spyOnProcessExit = () =>
  // eslint-disable-next-line typescript-eslint/no-unsafe-type-assertion -- process.exit returns `never`; mocking requires `as never`
  vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
