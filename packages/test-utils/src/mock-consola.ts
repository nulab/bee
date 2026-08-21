import { vi } from "vitest";

const mockConsola = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  success: vi.fn(),
  prompt: vi.fn(),
  start: vi.fn(),
  debug: vi.fn(),
};

// Default export for use with: vi.mock("consola", () => import("@repo/test-utils/mock-consola"))
// eslint-disable-next-line import/no-default-export
export default mockConsola;
