import isUnicodeSupported from "is-unicode-supported";

const unicode = isUnicodeSupported();

export const icons = {
  bee: unicode ? "\u{1F41D}" : ">",
  success: unicode ? "\u{1F36F}" : "OK",
  error: unicode ? "\u{1F525}" : "ERR",
  info: unicode ? "\u{1F41D}" : "i",
} as const;
