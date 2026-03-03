import { vi } from "vitest";

export type MockConsola = {
  error: ReturnType<typeof vi.fn>;
  warn: ReturnType<typeof vi.fn>;
  info: ReturnType<typeof vi.fn>;
  log: ReturnType<typeof vi.fn>;
  success: ReturnType<typeof vi.fn>;
  prompt: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  debug: ReturnType<typeof vi.fn>;
};

const mockConsola: MockConsola = {
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

export const setupMockConsola = (): MockConsola => {
  vi.mock("consola", () => ({
    default: mockConsola,
  }));

  return mockConsola;
};
