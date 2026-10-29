import { Action, ActionPanel, Detail, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import { launcherDirectory, syncLaunchers } from "./utils/launchers";
import { modelCatalog } from "./hooks/useModelCatalog";

export default function SetupCommandSearch({ commandName }: { commandName?: string }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const prepare = async () => {
    setReady(false);
    setError("");
    try {
      await modelCatalog.load();
      await syncLaunchers(modelCatalog.getSnapshot().catalog.commands);
      setReady(true);
    } catch (err) {
      setError(String(err));
      await showToast({ style: Toast.Style.Failure, title: "Could not create command launchers" });
    }
  };
  useEffect(() => {
    void prepare();
  }, []);
  if (error)
    return (
      <Detail
        markdown={`# Command setup did not complete\n\nYour saved commands are intact. Retry setup before adding the folder or assigning hotkeys.\n\n\`\`\`\n${error}\n\`\`\``}
        actions={
          <ActionPanel>
            <Action title="Retry Setup" onAction={prepare} />
            <Action.CopyToClipboard title="Copy Error Details" content={error} />
          </ActionPanel>
        }
      />
    );
  return (
    <Detail
      isLoading={!ready && !error}
      markdown={`# ${commandName ? "Script shortcut for “" + commandName + "”" : "Optional custom command search"}\n\n${error || "This optional integration adds dynamically saved prompts to main search. Built-in writing commands already have native entries and do not need a script folder."}\n\n## One-time setup\n\n1. Copy the script folder path using the action below.\n2. Open **Raycast Settings → Script Commands → Add Script Directory** (in some versions: **Extensions → Scripts**).\n3. Paste the folder path and add it.\n\n\`${launcherDirectory}\`\n\n## Assign a hotkey\n\n1. Return to Raycast’s **main search**.\n2. Search for **${commandName || "your command’s name"}** and select its **Script Command** entry under Commands.\n3. Press **Ctrl+K → Configure Command → Set Hotkey**.\n4. Press your key combination and save. You can also find the entry under **Settings → Shortcuts**.\n\nIf you only see the extension’s Commands list, the script folder has not been indexed yet. This screen regenerates launchers with Windows metadata. Re-add or refresh the folder if necessary. No Quicklinks are needed.\n\nThe native Raycast hotkey recorder cannot be embedded inside this extension’s command form. Selection handoff through the launchers still needs testing.`}
      actions={
        <ActionPanel>
          <Action.CopyToClipboard title="Copy Script Folder Path" content={launcherDirectory} />
          <Action.Open title="Open Script Folder" target={launcherDirectory} />
          {commandName && <Action.CopyToClipboard title="Copy Command Name" content={commandName} />}
        </ActionPanel>
      }
    />
  );
}
