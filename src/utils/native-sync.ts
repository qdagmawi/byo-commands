import { environment, LocalStorage } from "@raycast/api";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Command } from "../type";
import { CATALOG_STORAGE_KEY, type Catalog } from "./model-catalog";
import { syncNativeProject } from "./native-project";
import { readProviders } from "./provider-storage";

// This is a personal local-development integration, not a Store-extension API.
export async function syncNativeCommands(commands: Record<string, Command>) {
  if (environment.extensionName !== "personal-ai-commands") return false;
  let sourceRoot: string;
  try {
    const config = JSON.parse(await readFile(join(environment.assetsPath, "local-project.json"), "utf8"));
    if (typeof config.projectRoot !== "string" || !config.projectRoot) return false;
    sourceRoot = config.projectRoot;
  } catch {
    return false;
  }
  await access(join(sourceRoot, "src", "views", "command", "native-entry.tsx"));
  try {
    const pid = Number((await readFile(join(environment.assetsPath, "..", "cli.pid"), "utf8")).trim());
    if (!Number.isInteger(pid) || pid <= 0) throw new Error("Invalid development process");
    process.kill(pid, 0);
  } catch {
    throw new Error(
      "Start npm run dev in the local Commands project to register saved commands in Raycast Settings.",
    );
  }
  const providers = (await readProviders()).providers.map(({ id, name }) => ({ id, name }));
  await syncNativeProject(
    sourceRoot,
    async () => {
      const raw = await LocalStorage.getItem<string>(CATALOG_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Catalog).commands : commands;
    },
    providers,
  );
  return true;
}
