import consola from "consola";

type Column = {
  header: string;
  value: string;
};

type Row = Column[];

const truncate = (str: string, width: number): string => {
  if (str.length <= width) {
    return str;
  }
  return `${str.slice(0, width - 1)}…`;
};

const printTable = (rows: Row[]): void => {
  if (rows.length === 0) {
    return;
  }

  const columnCount = rows[0].length;
  const widths: number[] = [];

  for (let col = 0; col < columnCount; col++) {
    let max = rows[0][col].header.length;
    for (const row of rows) {
      if (row[col].value.length > max) {
        max = row[col].value.length;
      }
    }
    widths.push(max);
  }

  const header = widths.map((w, i) => rows[0][i].header.padEnd(w)).join("  ");
  consola.log(header);

  for (const row of rows) {
    const line = widths
      .map((w, i) => {
        const isLast = i === widths.length - 1;
        const val = truncate(row[i].value, w);
        return isLast ? val : val.padEnd(w);
      })
      .join("  ");
    consola.log(line);
  }
};

export { printTable, type Column, type Row };
