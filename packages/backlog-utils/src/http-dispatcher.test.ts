import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("consola", () => import("@repo/test-utils/mock-consola"));

vi.mock("undici", () => {
  const MockAgent = vi.fn();
  MockAgent.prototype.compose = vi.fn(function (this: unknown) {
    return this;
  });
  return {
    EnvHttpProxyAgent: MockAgent,
    setGlobalDispatcher: vi.fn(),
  };
});

describe("installHttpDispatcher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls setGlobalDispatcher with a composed EnvHttpProxyAgent", async () => {
    const { EnvHttpProxyAgent, setGlobalDispatcher } = await import("undici");
    const { installHttpDispatcher } = await import("./http-dispatcher");

    installHttpDispatcher();

    expect(EnvHttpProxyAgent).toHaveBeenCalled();
    expect(vi.mocked(EnvHttpProxyAgent).prototype.compose).toHaveBeenCalled();
    expect(setGlobalDispatcher).toHaveBeenCalled();
  });
});
