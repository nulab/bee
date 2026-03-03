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

export const setupMockConsola = (): MockConsola => {
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

  vi.mock("consola", () => ({
    default: mockConsola,
  }));

  return mockConsola;
};
