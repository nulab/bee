const MAX_RATE_LIMIT_WAIT_MS = 60_000;
const RATE_LIMIT_BUFFER_MS = 1000;

const formatResetTime = (epochSeconds: number): string => {
  const date = new Date(epochSeconds * 1000);
  return date.toString();
};

class BacklogRateLimitError extends Error {
  override readonly name = "BacklogRateLimitError";
  readonly resetAt: Date | undefined;

  constructor(message: string, resetAt?: Date) {
    super(message);
    this.resetAt = resetAt;
  }
}

export { BacklogRateLimitError, formatResetTime, MAX_RATE_LIMIT_WAIT_MS, RATE_LIMIT_BUFFER_MS };
