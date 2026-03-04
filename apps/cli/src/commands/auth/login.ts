import { createClient } from "@repo/api";
import { exchangeAuthorizationCode, openUrl, startCallbackServer } from "@repo/backlog-utils";
import { promptRequired, readStdin } from "@repo/cli-utils";
import { addSpace, findSpace, loadConfig, updateSpaceAuth, writeConfig } from "@repo/config";
import type { RcAuth } from "@repo/config";
import { defineCommand } from "citty";
import consola from "consola";

type BacklogUser = {
  name: string;
  userId: string;
};

export const login = defineCommand({
  meta: {
    name: "login",
    description: "Authenticate with a Backlog space",
  },
  args: {
    space: {
      type: "string",
      alias: "s",
      description: "Space hostname (e.g., xxx.backlog.com)",
    },
    method: {
      type: "string",
      alias: "m",
      description: "Auth method: api-key or oauth",
      default: "api-key",
    },
    "with-token": {
      type: "boolean",
      description: "Read token from stdin",
    },
    "client-id": {
      type: "string",
      description: "OAuth Client ID",
    },
    "client-secret": {
      type: "string",
      description: "OAuth Client Secret",
    },
  },
  async run({ args }) {
    const { method } = args;

    if (method !== "api-key" && method !== "oauth") {
      consola.error('Invalid auth method. Use "api-key" or "oauth".');
      return process.exit(1);
    }

    const hostname = await promptRequired(
      "Backlog space hostname:",
      args.space || process.env.BACKLOG_SPACE,
      { placeholder: "xxx.backlog.com" },
    );

    if (method === "api-key") {
      await loginWithApiKey(hostname, args);
    } else {
      await loginWithOAuth(hostname, args);
    }
  },
});

async function loginWithApiKey(hostname: string, args: { "with-token"?: boolean }): Promise<void> {
  const apiKey = args["with-token"] ? await readStdin() : await promptRequired("API key:");

  consola.start(`Authenticating with ${hostname}...`);

  const client = createClient({ host: hostname, apiKey });
  let user: BacklogUser;
  try {
    user = await client<BacklogUser>("/users/myself");
  } catch {
    consola.error(
      `Authentication failed. Could not connect to ${hostname} with the provided API key.`,
    );
    return process.exit(1);
  }

  saveSpace(hostname, { method: "api-key", apiKey });
  consola.success(`Logged in to ${hostname} as ${user.name} (${user.userId})`);
}

async function loginWithOAuth(
  hostname: string,
  args: { "client-id"?: string; "client-secret"?: string },
): Promise<void> {
  const clientId = await promptRequired(
    "OAuth Client ID:",
    args["client-id"] ?? process.env.BACKLOG_OAUTH_CLIENT_ID,
  );

  const clientSecret = await promptRequired(
    "OAuth Client Secret:",
    args["client-secret"] ?? process.env.BACKLOG_OAUTH_CLIENT_SECRET,
  );

  const callbackServer = startCallbackServer();
  const redirectUri = `http://localhost:${callbackServer.port}/callback`;
  const state = crypto.randomUUID();

  const authUrl = new URL(`https://${hostname}/OAuth2AccessRequest.action`);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  consola.info("Opening browser for authorization...");
  consola.info(`If the browser doesn't open, visit: ${authUrl.toString()}`);

  await openUrl(authUrl.toString());

  let code: string;
  try {
    code = await callbackServer.waitForCallback(state);
  } catch (error) {
    callbackServer.stop();
    consola.error(
      `OAuth authorization failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return process.exit(1);
  } finally {
    callbackServer.stop();
  }

  consola.start("Exchanging authorization code for tokens...");

  let tokenResponse: Awaited<ReturnType<typeof exchangeAuthorizationCode>>;
  try {
    tokenResponse = await exchangeAuthorizationCode(hostname, {
      code,
      clientId,
      clientSecret,
      redirectUri,
    });
  } catch {
    consola.error("Failed to exchange authorization code for tokens.");
    return process.exit(1);
  }

  const client = createClient({ host: hostname, accessToken: tokenResponse.access_token });
  let user: BacklogUser;
  try {
    user = await client<BacklogUser>("/users/myself");
  } catch {
    consola.error("Authentication verification failed.");
    return process.exit(1);
  }

  saveSpace(hostname, {
    method: "oauth",
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    clientId,
    clientSecret,
  });
  consola.success(`Logged in to ${hostname} as ${user.name} (${user.userId})`);
}

function saveSpace(hostname: string, auth: RcAuth): void {
  const config = loadConfig();
  const existing = findSpace(config.spaces, hostname);

  if (existing) {
    updateSpaceAuth(hostname, auth);
  } else {
    addSpace({ host: hostname, auth });
  }

  if (!config.defaultSpace) {
    writeConfig({ ...config, defaultSpace: hostname });
  }
}
