import { Action, ActionPanel, Detail, List, Icon, openCommandPreferences } from "@raycast/api";
import { useState } from "react";
import { useCommand } from "../../hooks/useCommand";
import { commandForSlot, slotTitle } from "../../utils/command-slots";
import { commandIconPath } from "../../utils/command-icons";
import type { CommandLaunchProps } from "./command-view";
import NativeCommandEntry from "./native-entry";

export default function CommandSlotEntry(props: CommandLaunchProps & { slot: string }) {
  const commands = useCommand();
  const [assignment, setAssignment] = useState<{ name: string; pending: boolean }>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  if (assignment)
    return (
      <Detail
        isLoading={assignment.pending}
        markdown={
          assignment.pending
            ? ""
            : `# ${slotTitle(props.slot)} is ready\n\nAssigned to **${assignment.name}**. Launch this slot again to run it. Set its alias or hotkey in Raycast Settings.`
        }
        actions={
          <ActionPanel>
            <Action title="Configure Slot Hotkey" onAction={openCommandPreferences} />
          </ActionPanel>
        }
      />
    );
  const command = commandForSlot(commands.data, props.slot);
  if (command) return <NativeCommandEntry {...props} commandId={command.id} />;
  return (
    <List
      navigationTitle={`Assign ${slotTitle(props.slot)}`}
      isLoading={commands.isLoading}
      selectedItemId={selectedId ?? undefined}
      onSelectionChange={setSelectedId}
      searchBarPlaceholder="Choose a saved command…"
    >
      <List.EmptyView
        icon={Icon.Keyboard}
        title="No saved commands available"
        description="Create a prompt in Commands, then choose its Hotkey Slot."
      />
      {Object.values(commands.data)
        .filter((item) => !item.shortcutSlot)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((item) => (
          <List.Item
            id={item.id}
            key={item.id}
            title={item.name}
            icon={commandIconPath(item.icon)}
            actions={
              <ActionPanel>
                <Action
                  title={`Assign to ${slotTitle(props.slot)}`}
                  onAction={async () => {
                    setAssignment({ name: item.name, pending: true });
                    try {
                      await commands.update({ ...item, shortcutSlot: props.slot });
                      setAssignment({ name: item.name, pending: false });
                    } catch {
                      setAssignment(undefined);
                    }
                  }}
                />
                <Action title="Open Native Slot Settings" onAction={openCommandPreferences} />
              </ActionPanel>
            }
          />
        ))}
    </List>
  );
}
