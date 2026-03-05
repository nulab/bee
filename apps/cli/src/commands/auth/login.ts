import { exchangeAuthorizationCode, openUrl, startCallbackServer } from "@repo/backlog-utils";
import { promptRequired, readStdin } from "@repo/cli-utils";
import { type RcAuth, updateConfig } from "@repo/config";
import { Backlog, OAuth2 } from "backlog-js";
import { defineCommand } from "citty";
import consola from "consola";
import { type CommandUsage, withUsage } from "../../lib/command-usage";

const commandUsage: CommandUsage = {
  long: `Authenticate with a Backlog space.

The default authentication mode is API key. You will be prompted to enter
the space hostname and API key interactively.

Alternatively, use \`--with-token\` to pass an API key on standard input.
For OAuth authentication, use \`--method oauth\`. You will need to provide
an OAuth Client ID and Client Secret, then authorize in the browser.`,

  examples: [
    { description: "Start interactive setup", command: "bee auth login" },
    {
      description: "Login with API key from stdin",
      command: "echo 'your-api-key' | BACKLOG_SPACE=xxx.backlog.com bee auth login --with-token",
    },
    { description: "Login with OAuth", command: "bee auth login -m oauth" },
  ],

  annotations: {
    environment: [
      ["BACKLOG_SPACE", "Default space hostname"],
      ["BACKLOG_OAUTH_CLIENT_ID", "OAuth Client ID"],
      ["BACKLOG_OAUTH_CLIENT_SECRET", "OAuth Client Secret"],
    ],
  },
};

const login = withUsage(
  defineCommand({
    meta: {
      name: "login",
      description: "Authenticate with a Backlog space",
    },
    args: {
      method: {
        type: "string",
        alias: "m",
        description: "The authentication method to use",
        valueHint: "{api-key|oauth}",
        default: "api-key",
      },
      "with-token": {
        type: "boolean",
        description: "Read token from standard input",
      },
      "client-id": {
        type: "string",
        description: "The OAuth Client ID to use when authenticating with Backlog",
      },
      "client-secret": {
        type: "string",
        description: "The OAuth Client Secret to use when authenticating with Backlog",
      },
    },
    async run({ args }) {
      const { method } = args;

      if (method !== "api-key" && method !== "oauth") {
        consola.error('Invalid auth method. Use "api-key" or "oauth".');
        return process.exit(1);
      }

      const hostname = await promptRequired("Backlog space hostname:", process.env.BACKLOG_SPACE, {
        placeholder: "xxx.backlog.com",
      });

      await (method === "api-key"
        ? loginWithApiKey(hostname, args)
        : loginWithOAuth(hostname, args));
    },
  }),
  commandUsage,
);

const loginWithApiKey = async (
  hostname: string,
  args: { "with-token"?: boolean },
): Promise<void> => {
  const apiKey = args["with-token"] ? await readStdin() : await promptRequired("API key:");

  consola.start(`Authenticating with ${hostname}...`);

  let user;
  try {
    const client = new Backlog({ host: hostname, apiKey });
    user = await client.getMyself();
  } catch {
    consola.error(
      `Authentication failed. Could not connect to ${hostname} with the provided API key.`,
    );
    return process.exit(1);
  }

  saveSpace(hostname, { method: "api-key", apiKey });
  consola.success(`Logged in to ${hostname} as ${user.name} (${user.userId})`);
};

const loginWithOAuth = async (
  hostname: string,
  args: { "client-id"?: string; "client-secret"?: string },
): Promise<void> => {
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

  const oauth2 = new OAuth2({ clientId, clientSecret });
  const authUrl = oauth2.getAuthorizationURL({ host: hostname, redirectUri, state });

  consola.info("Opening browser for authorization...");
  consola.info(`If the browser doesn't open, visit: ${authUrl}`);

  await openUrl(authUrl);

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

  let user;
  try {
    const client = new Backlog({ host: hostname, accessToken: tokenResponse.access_token });
    user = await client.getMyself();
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
};

const saveSpace = (hostname: string, auth: RcAuth): void => {
  updateConfig((config) => {
    const index = config.spaces.findIndex((s) => s.host === hostname);
    const spaces =
      index === -1
        ? [...config.spaces, { host: hostname, auth }]
        : config.spaces.with(index, { ...config.spaces[index], auth });
    const defaultSpace = config.defaultSpace ?? hostname;
    return { ...config, spaces, defaultSpace };
  });
};

export { commandUsage, login };
