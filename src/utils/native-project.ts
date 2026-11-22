import { createHash, randomUUID } from "node:crypto";
import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "../type";
import { commandIconPath } from "./command-icons";
import { withDirectoryLock } from "./file-lock";

export const nativeBuiltIns: Record<string, string> = {
  "default-fix-spelling-and-grammar": "fix-spelling-and-grammar",
  "default-improve-writing": "improve-writing",
  "default-summarize-webpage": "summarize-webpage",
};
export const nativeCommandName = (id: string) =>
  nativeBuiltIns[id] ?? `custom-ai-${createHash("sha256").update(id).digest("hex").slice(0, 24)}`;

export async function syncNativeProject(
  root: string,
  readCommands: () => Promise<Record<string, Command>>,
  providers: { id: string; name: string }[] = [],
) {
  return withDirectoryLock(root, ".native-commands.lock", async () => {
    const manifestPath = join(root, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (manifest.name !== "personal-ai-commands" && manifest.name !== "byo-commands")
      throw new Error("This is not the personal Commands project.");
    const commands = Object.values(await readCommands());
    const owned = new Set(Object.values(nativeBuiltIns));
    const management = manifest.commands.filter(
      (entry: { name: string }) => !owned.has(entry.name) && !entry.name.startsWith("custom-ai-"),
    );
    for (const command of commands) {
      const name = nativeCommandName(command.id);
      const source = `// Generated native entry. Settings and hotkey identity remain stable across edits.\nimport NativeCommandEntry from "./views/command/native-entry";\nimport type { CommandLaunchProps } from "./views/command/command-view";\n\nexport default function Entry(props: CommandLaunchProps) {\n  return <NativeCommandEntry {...props} commandId={${JSON.stringify(command.id)}} />;\n}\n`;
      const path = join(root, "src", `${name}.tsx`);
      let previous = "";
      try {
        previous = await readFile(path, "utf8");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      if (previous !== source) await writeFile(path, source, "utf8");
    }
    const entries = commands.map((command) => ({
      name: nativeCommandName(command.id),
      title: command.name,
      description: "Run this saved AI command. Expand its settings for command-specific overrides.",
      mode: "view",
      subtitle: "Commands",
      icon: commandIconPath(command.icon),
      preferences: [
        {
          name: "aiProviderOverride",
          title: "Provider",
          type: "dropdown",
          required: false,
          default: "saved",
          description:
            "Use this command's saved provider or override it here. Choose a matching model ID when changing providers.",
          data: [
            { title: "Use Saved Command", value: "saved" },
            { title: "Default Provider", value: "default" },
            ...providers.map((p) => ({ title: p.name, value: p.id })),
          ],
        },
        {
          name: "aiPromptOverride",
          title: "Prompt Override",
          type: "textfield",
          required: false,
          description: "Leave blank to use the prompt saved in Edit AI Command.",
        },
        {
          name: "aiModelOverride",
          title: "Model ID Override",
          type: "textfield",
          required: false,
          description: "Leave blank to follow this command's saved model configuration.",
        },
        {
          name: "aiTemperatureOverride",
          title: "Temperature Override",
          type: "textfield",
          required: false,
          description: "Optional number from 0 to 2. Leave blank to use the saved setting.",
        },
        {
          name: "aiSourceOverride",
          title: "Input Source",
          description: "Follow the saved input source or override it for this command.",
          type: "dropdown",
          required: false,
          default: "saved",
          data: [
            { title: "Use Saved Command", value: "saved" },
            { title: "Selected Text", value: "selectedText" },
            { title: "Clipboard", value: "clipboard" },
            { title: "Browser Tab", value: "browserTab" },
          ],
        },
      ],
    }));
    const next = JSON.stringify({ ...manifest, commands: [...entries, ...management] }, null, 2) + "\n";
    if (next !== (await readFile(manifestPath, "utf8"))) {
      const temporary = `${manifestPath}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, next, "utf8");
        await rename(temporary, manifestPath);
      } finally {
        await unlink(temporary).catch(() => {});
      }
    }
    return entries.map((entry) => entry.name);
  });
}
