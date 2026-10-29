import { mkdir, open, readFile, stat, unlink } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

export async function withDirectoryLock<T>(directory: string, name: string, action: () => Promise<T>): Promise<T> {
  await mkdir(directory, { recursive: true });
  const lockPath = join(directory, name);
  const deadline = Date.now() + 15000;
  for (;;) {
    let handle;
    try {
      handle = await open(lockPath, "wx");
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? "";
      if (code !== "EEXIST" && !(process.platform === "win32" && ["EPERM", "EBUSY", "EACCES"].includes(code)))
        throw error;
      try {
        const owner = Number(await readFile(lockPath, "utf8"));
        let alive = true;
        if (owner > 0) {
          try {
            process.kill(owner, 0);
          } catch (err) {
            alive = (err as NodeJS.ErrnoException).code !== "ESRCH";
          }
        } else alive = Date.now() - (await stat(lockPath)).mtimeMs < 30000;
        if (!alive) {
          await unlink(lockPath).catch(() => {});
          continue;
        }
      } catch {
        /* The current owner may be creating or releasing its lock. */
      }
      if (Date.now() > deadline)
        throw new Error("Another configuration update is still running. Wait a moment and retry.");
      await delay(25);
      continue;
    }
    try {
      await handle.writeFile(String(process.pid));
      return await action();
    } finally {
      await handle.close();
      await unlink(lockPath).catch(() => {});
    }
  }
}
