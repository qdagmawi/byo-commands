import { mkdir, readdir, readFile, writeFile, rename, unlink } from "node:fs/promises";
import { join, basename } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import type { Command } from "../type";
import { launcherContent } from "./launcher-content";
import { commandIconPath } from "./command-icons";
import { withDirectoryLock } from "./file-lock";

export type LauncherOptions = {
  directory: string;
  assetsPath: string;
  commands: Record<string, Command>;
  author: string;
  extension: string;
  scheme?: string;
  readCommands?: () => Promise<Record<string, Command>>;
};
export async function syncLauncherFiles(options: LauncherOptions) {
  const { directory, assetsPath, author, extension, scheme = "raycast" } = options;
  await withDirectoryLock(directory, ".sync.lock", async () => {
    const commands = options.readCommands ? await options.readCommands() : options.commands;
    await mkdir(join(directory, "command-icons"), { recursive: true });
    const desired = new Set<string>();
    for (const command of Object.values(commands)) {
      const source = commandIconPath(command.icon);
      const bytes = await readFile(join(assetsPath, source));
      const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
      const icon = `command-icons/${basename(source, ".png")}-${digest}.png`;
      try {
        await writeFile(join(directory, icon), bytes, { flag: "wx" });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      }
      const filename = `ai-command-${createHash("sha256").update(command.id).digest("hex").slice(0, 24)}.ps1`;
      desired.add(filename);
      const destination = join(directory, filename);
      const content = launcherContent(command.name, command.id, author, extension, scheme, icon);
      let previous: string | undefined;
      try {
        previous = await readFile(destination, "utf8");
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
      if (previous === content) continue;
      const temporary = `${destination}.${randomUUID()}.tmp`;
      try {
        await writeFile(temporary, content, "utf8");
        for (let attempt = 0; ; attempt++) {
          try {
            await rename(temporary, destination);
            break;
          } catch (error) {
            if (attempt >= 5 || !["EBUSY", "EPERM", "EACCES"].includes((error as NodeJS.ErrnoException).code ?? ""))
              throw error;
            await delay(40 * (attempt + 1));
          }
        }
      } finally {
        await unlink(temporary).catch(() => {});
      }
    }
    for (const filename of await readdir(directory)) {
      if (/^ai-command-[a-f0-9]{24}\.ps1$/.test(filename) && !desired.has(filename)) {
        await unlink(join(directory, filename)).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
    }
  });
}
