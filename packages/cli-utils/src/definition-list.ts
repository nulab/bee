import consola from "consola";
import { stringWidth, widthPadEnd } from "./string-width";

type DefinitionItem = [label: string, value: string | undefined | null];

const printDefinitionList = (items: DefinitionItem[], indent = 4): void => {
  const filtered = items.filter(
    (item): item is [string, string] => item[1] !== null && item[1] !== undefined && item[1] !== "",
  );

  if (filtered.length === 0) {
    return;
  }

  const maxLabel = Math.max(...filtered.map(([label]) => stringWidth(label)));
  const pad = " ".repeat(indent);

  for (const [label, value] of filtered) {
    consola.log(`${pad}${widthPadEnd(label, maxLabel)}  ${value}`);
  }
};

export { printDefinitionList, type DefinitionItem };
