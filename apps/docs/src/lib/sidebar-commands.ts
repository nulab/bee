import { loadCommands } from "./commands";

type SidebarItem = { label: string; link: string };
type SidebarGroup = { label: string; items: SidebarItem[] };
type SidebarEntry = SidebarGroup | SidebarItem;

const loadCommandSidebar = async (): Promise<SidebarEntry[]> => {
  const commands = await loadCommands();

  const groups = new Map<string, SidebarItem[]>();
  const topLevel: SidebarItem[] = [];

  for (const cmd of commands) {
    if (cmd.parent) {
      let items = groups.get(cmd.parent);
      if (!items) {
        items = [];
        groups.set(cmd.parent, items);
      }
      items.push({
        label: `${cmd.parent} ${cmd.name}`,
        link: `/commands/${cmd.id}`,
      });
    } else {
      topLevel.push({
        label: cmd.name,
        link: `/commands/${cmd.id}`,
      });
    }
  }

  const entries: SidebarEntry[] = [];

  for (const [label, items] of groups) {
    entries.push({
      label,
      items: items.toSorted((a, b) => a.label.localeCompare(b.label)),
    });
  }

  entries.push(...topLevel);

  entries.sort((a, b) => a.label.localeCompare(b.label));

  return entries;
};

export { loadCommandSidebar };
export type { SidebarEntry };
