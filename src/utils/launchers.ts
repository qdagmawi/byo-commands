import { environment, LocalStorage } from "@raycast/api";
import { join } from "node:path";
import type { Command } from "../type";
import packageJson from "../../package.json";
import { syncLauncherFiles } from "./launcher-files";
import { CATALOG_STORAGE_KEY, type Catalog } from "./model-catalog";

export const launcherDirectory = join(environment.supportPath, "command-launchers");
export async function syncLaunchers(commands: Record<string, Command>) {
  if (process.platform !== "win32") return;
  await syncLauncherFiles({
    directory: launcherDirectory,
    assetsPath: environment.assetsPath,
    commands,
    author: environment.ownerOrAuthorName || packageJson.author,
    extension: environment.extensionName || packageJson.name,
    scheme: process.env.RAYCAST_SCHEME ?? "raycast",
    readCommands: async () => {
      const raw = await LocalStorage.getItem<string>(CATALOG_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Catalog).commands : commands;
    },
  });
}
