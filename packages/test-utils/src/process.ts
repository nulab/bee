import { vi } from "vitest";

export function spyOnProcessExit() {
  return vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
}
