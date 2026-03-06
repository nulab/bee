import stringWidth from "string-width";

const widthPadEnd = (str: string, targetWidth: number): string => {
  const w = stringWidth(str);
  if (w >= targetWidth) {
    return str;
  }
  return str + " ".repeat(targetWidth - w);
};

const widthTruncate = (str: string, maxWidth: number): string => {
  if (stringWidth(str) <= maxWidth) {
    return str;
  }

  let width = 0;
  let result = "";
  for (const char of str) {
    const charWidth = stringWidth(char);
    if (width + charWidth > maxWidth - 1) {
      break;
    }
    result += char;
    width += charWidth;
  }
  return `${result}…`;
};

export { stringWidth, widthPadEnd, widthTruncate };
