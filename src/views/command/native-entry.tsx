import { Action, ActionPanel, Detail, getPreferenceValues, openCommandPreferences } from "@raycast/api";
import CommandView, { CommandLaunchProps } from "./command-view";

export type NativeOverrides = {
  aiProviderOverride?: string;
  aiPromptOverride?: string;
  aiModelOverride?: string;
  aiTemperatureOverride?: string;
  aiSourceOverride?: "saved" | "selectedText" | "clipboard" | "browserTab";
};

export default function NativeCommandEntry(props: CommandLaunchProps & { commandId: string }) {
  const overrides = getPreferenceValues<NativeOverrides>();
  if (
    overrides.aiTemperatureOverride?.trim() &&
    (!Number.isFinite(Number(overrides.aiTemperatureOverride)) ||
      Number(overrides.aiTemperatureOverride) < 0 ||
      Number(overrides.aiTemperatureOverride) > 2)
  ) {
    return (
      <Detail
        markdown="# Invalid temperature\n\nSet Temperature Override to a number from 0 to 2, or leave it blank to use the saved command setting."
        actions={
          <ActionPanel>
            <Action title="Edit Command Preferences" onAction={openCommandPreferences} />
          </ActionPanel>
        }
      />
    );
  }
  return <CommandView {...props} launchContext={{ commandId: props.commandId }} overrides={overrides} />;
}
