import consola from "consola";

type DefinitionItem = [label: string, value: string | undefined | null];

const printDefinitionList = (items: DefinitionItem[], indent = 4): void => {
  const filtered = items.filter(
    (item): item is [string, string] => item[1] != null && item[1] !== "",
  );

  if (filtered.length === 0) {
    return;
  }

  const maxLabel = Math.max(...filtered.map(([label]) => label.length));
  const pad = " ".repeat(indent);

  for (const [label, value] of filtered) {
    consola.log(`${pad}${label.padEnd(maxLabel)}  ${value}`);
  }
};

export { printDefinitionList, type DefinitionItem };
