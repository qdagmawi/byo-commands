import CommandSlotEntry from "./views/command/slot-entry";
import type { CommandLaunchProps } from "./views/command/command-view";

export default function Entry(props: CommandLaunchProps) {
  return <CommandSlotEntry {...props} slot="11" />;
}
