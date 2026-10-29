// Generated native entry. Settings and hotkey identity remain stable across edits.
import NativeCommandEntry from "./views/command/native-entry";
import type { CommandLaunchProps } from "./views/command/command-view";

export default function Entry(props: CommandLaunchProps) {
  return <NativeCommandEntry {...props} commandId={"default-improve-writing"} />;
}
