import { useEffect, useState } from "react";
import { showToast, Toast } from "@raycast/api";
import { ProviderSettings } from "../utils/providers";
import { readProviders } from "../utils/provider-storage";

export function useProviders() {
  const [settings, setSettings] = useState<ProviderSettings>({ version: 1, providers: [] });
  const [isLoading, setLoading] = useState(true);
  async function reload() {
    try {
      setSettings(await readProviders());
    } catch {
      await showToast({ style: Toast.Style.Failure, title: "Could not load providers" });
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void reload();
  }, []);
  return { settings, isLoading, reload };
}
