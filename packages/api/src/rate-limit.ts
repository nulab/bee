export const formatResetTime = (epochSeconds: number): string => {
  const date = new Date(epochSeconds * 1000);
  return date.toLocaleString();
};

export class BacklogRateLimitError extends Error {
  override readonly name = "BacklogRateLimitError";
  readonly resetAt: Date | undefined;

  constructor(message: string, resetAt?: Date) {
    super(message);
    this.resetAt = resetAt;
  }
}
