import { exchangeAuthorizationCode, openUrl, startCallbackServer } from "@repo/backlog-utils";
import { UserError, promptRequired, readStdin } from "@repo/cli-utils";
import { type RcAuth, updateConfig } from "@repo/config";
import { Backlog, OAuth2 } from "backlog-js";
import consola from "consola";
import { BeeCommand } from "../../lib/bee-command";

const login = new BeeCommand("login")
  .summary("Authenticate with a Backlog space")
  .description(
    `The default mode is API key with interactive prompts.

Use \`--with-token\` to pass an API key on standard input.
Use \`--method oauth\` for OAuth authentication via the browser.`,
  )
  .option("-m, --method <method>", "The authentication method to use", "api-key")
  .option("--with-token", "Read token from standard input")
  .envVars([
    ["BACKLOG_SPACE", "Default space hostname"],
    ["BACKLOG_OAUTH_CLIENT_ID", "OAuth Client ID"],
    ["BACKLOG_OAUTH_CLIENT_SECRET", "OAuth Client Secret"],
    ["BACKLOG_OAUTH_PORT", "OAuth callback port (default: 5033)"],
  ])
  .examples([
    { description: "Start interactive setup", command: "bee auth login" },
    {
      description: "Login with API key from stdin",
      command: "echo 'your-api-key' | bee auth login --with-token",
    },
    { description: "Login with OAuth", command: "bee auth login -m oauth" },
  ])
  .action(async (opts) => {
    const { method } = opts;

    if (method !== "api-key" && method !== "oauth") {
      throw new UserError('Invalid auth method. Use "api-key" or "oauth".');
    }

    const hostname = await promptRequired("Backlog space hostname:", process.env.BACKLOG_SPACE, {
      placeholder: "xxx.backlog.com",
    });

    await (method === "api-key" ? loginWithApiKey(hostname, opts) : loginWithOAuth(hostname));
  });

const loginWithApiKey = async (hostname: string, opts: { withToken?: boolean }): Promise<void> => {
  if (!opts.withToken) {
    consola.info(`Tip: you can generate an API key at https://${hostname}/EditApiSettings.action`);
  }
  const apiKey = opts.withToken ? await readStdin() : await promptRequired("API key:");

  consola.start(`Authenticating with ${hostname}...`);

  let user;
  try {
    const client = new Backlog({ host: hostname, apiKey });
    user = await client.getMyself();
  } catch {
    throw new UserError(
      `Authentication failed. Could not connect to ${hostname} with the provided API key.`,
    );
  }

  saveSpace(hostname, { method: "api-key", apiKey });
  consola.success(`Logged in to ${hostname} as ${user.name} (${user.userId})`);
};

const loginWithOAuth = async (hostname: string): Promise<void> => {
  const clientId = process.env.BACKLOG_OAUTH_CLIENT_ID;
  const clientSecret = process.env.BACKLOG_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new UserError(
      "BACKLOG_OAUTH_CLIENT_ID and BACKLOG_OAUTH_CLIENT_SECRET must be set as environment variables.",
    );
  }

  const port = process.env.BACKLOG_OAUTH_PORT ? Number(process.env.BACKLOG_OAUTH_PORT) : undefined;
  if (port !== undefined && (!Number.isInteger(port) || port < 0 || port > 65_535)) {
    throw new UserError("BACKLOG_OAUTH_PORT must be an integer between 0 and 65535.");
  }
  const callbackServer = startCallbackServer(port);
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
    throw new UserError(
      `OAuth authorization failed: ${error instanceof Error ? error.message : String(error)}`,
    );
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
    throw new UserError("Failed to exchange authorization code for tokens.");
  }

  let user;
  try {
    const client = new Backlog({ host: hostname, accessToken: tokenResponse.access_token });
    user = await client.getMyself();
  } catch {
    throw new UserError("Authentication verification failed.");
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

export default login;
