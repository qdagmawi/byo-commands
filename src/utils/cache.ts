import { Cache, environment } from "@raycast/api";
import { mkdirSync, readFileSync, writeFileSync, renameSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";

export class CacheAdapter {
  private readonly key: string;
  private readonly cache: Cache;
  private readonly mirrorPath: string;

  constructor(key: string) {
    this.key = key;
    this.mirrorPath = join(
      environment.supportPath,
      `.ui-state-${createHash("sha256").update(key).digest("hex").slice(0, 16)}.json`,
    );
    this.cache = new Cache({
      namespace: "abielzulio.chatgpt",
    });
  }

  get() {
    try {
      const value = JSON.parse(readFileSync(this.mirrorPath, "utf8"));
      if (typeof value === "string") return value;
    } catch {
      /* Existing Native Cache remains the migration/failure fallback. */
    }
    return this.cache.get(this.key);
  }

  set(value: string) {
    // Native Cache flushes asynchronously. Mirror this non-secret UI choice before
    // the command can unload, so immediately reopening it restores the selection.
    const temporary = `${this.mirrorPath}.${randomUUID()}.tmp`;
    try {
      mkdirSync(environment.supportPath, { recursive: true });
      writeFileSync(temporary, JSON.stringify(value), "utf8");
      renameSync(temporary, this.mirrorPath);
    } catch {
      /* Do not block a selection if the UI-state mirror cannot be written. */
    } finally {
      try {
        unlinkSync(temporary);
      } catch {
        /* Already renamed or never created. */
      }
    }
    this.cache.set(this.key, value);
  }
}
