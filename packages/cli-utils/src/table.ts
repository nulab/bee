import consola from "consola";
import { stringWidth, widthPadEnd, widthTruncate } from "./string-width";

type Column = {
  header: string;
  value: string;
};

type Row = Column[];

const printTable = (rows: Row[]): void => {
  if (rows.length === 0) {
    return;
  }

  const columnCount = rows[0].length;
  const widths: number[] = [];

  for (let col = 0; col < columnCount; col++) {
    let max = stringWidth(rows[0][col].header);
    for (const row of rows) {
      const w = stringWidth(row[col].value);
      if (w > max) {
        max = w;
      }
    }
    widths.push(max);
  }

  const header = widths.map((w, i) => widthPadEnd(rows[0][i].header, w)).join("  ");
  consola.log(header);

  for (const row of rows) {
    const line = widths
      .map((w, i) => {
        const isLast = i === widths.length - 1;
        const val = widthTruncate(row[i].value, w);
        return isLast ? val : widthPadEnd(val, w);
      })
      .join("  ");
    consola.log(line);
  }
};

export { printTable, type Column, type Row };
