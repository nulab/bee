import type { CallbackServer } from "#/oauth-callback.js";

import { startCallbackServer } from "#/oauth-callback.js";
import { afterEach, describe, expect, it } from "vitest";

const BASE_URL = "http://localhost:5033";

describe("startCallbackServer", () => {
  let server: CallbackServer;

  afterEach(() => {
    server?.stop();
  });

  it("returns an object with port, waitForCallback, stop", () => {
    server = startCallbackServer();
    expect(server).toHaveProperty("port");
    expect(server).toHaveProperty("waitForCallback");
    expect(server).toHaveProperty("stop");
    expect(typeof server.port).toBe("number");
    expect(typeof server.waitForCallback).toBe("function");
    expect(typeof server.stop).toBe("function");
  });

  it("uses port 5033", () => {
    server = startCallbackServer();
    expect(server.port).toBe(5033);
  });

  it("resolves with authorization code on valid callback", async () => {
    server = startCallbackServer();
    const promise = server.waitForCallback("test-state");

    const res = await fetch(`${BASE_URL}/callback?code=auth-code-123&state=test-state`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Authentication Successful");

    const code = await promise;
    expect(code).toBe("auth-code-123");
  });

  it("rejects with CSRF error on state mismatch", async () => {
    server = startCallbackServer();
    const promise = server.waitForCallback("expected-state");
    // Prevent unhandled rejection warning
    promise.catch(() => {});

    await fetch(`${BASE_URL}/callback?code=auth-code-123&state=wrong-state`);

    await expect(promise).rejects.toThrow("OAuth state mismatch — possible CSRF attack");
  });

  it("rejects with OAuth error when error query param is present", async () => {
    server = startCallbackServer();
    const promise = server.waitForCallback("test-state");
    // Prevent unhandled rejection warning
    promise.catch(() => {});

    const res = await fetch(`${BASE_URL}/callback?error=access_denied`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Authentication Failed");

    await expect(promise).rejects.toThrow("OAuth error: access_denied");
  });

  it("rejects when code or state is missing", async () => {
    server = startCallbackServer();
    const promise = server.waitForCallback("test-state");
    // Prevent unhandled rejection warning
    promise.catch(() => {});

    const res = await fetch(`${BASE_URL}/callback?code=auth-code-123`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Authentication Failed");

    await expect(promise).rejects.toThrow("Missing code or state parameter");
  });

  it("returns 404 for non-callback paths", async () => {
    server = startCallbackServer();

    const res = await fetch(`${BASE_URL}/other-path`);
    expect(res.status).toBe(404);
  });

  it("stops the server when stop is called", async () => {
    server = startCallbackServer();
    server.stop();

    await expect(fetch(`${BASE_URL}/callback?code=abc&state=xyz`)).rejects.toThrow();
  });
});
