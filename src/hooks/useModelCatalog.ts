import { environment, LocalStorage, showToast, Toast } from "@raycast/api";
import { useEffect, useSyncExternalStore } from "react";
import { createModelCatalog } from "../utils/model-catalog";
import { syncLaunchers } from "../utils/launchers";
import { withDirectoryLock } from "../utils/file-lock";
import { syncNativeCommands } from "../utils/native-sync";

export const modelCatalog = createModelCatalog({
  getItem: (key) => LocalStorage.getItem<string>(key),
  setItem: (key, value) => LocalStorage.setItem(key, value),
  withLock: (action) => withDirectoryLock(environment.supportPath, ".catalog-write.lock", action),
});

export function useModelCatalog(store = modelCatalog) {
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
  useEffect(() => {
    void store.load().catch(() => {});
  }, [store]);
  if (snapshot.error) throw snapshot.error;
  return snapshot;
}

export async function saveConfiguration(action: () => Promise<void>, title: string, updateLaunchers = false) {
  try {
    await action();
    try {
      if (updateLaunchers) {
        const commands = modelCatalog.getSnapshot().catalog.commands;
        if (!(await syncNativeCommands(commands))) {
          if (environment.extensionName === "personal-ai-commands") {
            await showToast({ title, message: "Saved in AI Commands. Native Settings entries require the source package running in local mode.", style: Toast.Style.Success });
            return;
          }
          await syncLaunchers(commands);
        }
      }
    } catch {
      await showToast({
        title: "Saved, but search entries need repair",
        message: "Your command is saved. Check that the local development build is running, then save it again.",
        style: Toast.Style.Failure,
      });
      return;
    }
    await showToast({ title, style: Toast.Style.Success });
  } catch (error) {
    await showToast({ title: "Could not save configuration", message: String(error), style: Toast.Style.Failure });
    throw error;
  }
}
