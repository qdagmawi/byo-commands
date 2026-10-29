import { useEffect, useState } from "react";
import { getProviderClient } from "./api-client";
import { readProviders } from "../utils/provider-storage";
import { resolveProvider, visibleModels } from "../utils/providers";

export function useModelOptions(providerId?: string) {
  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    setOptions([]);
    setLoading(true);
    void (async () => {
      try {
        const provider = resolveProvider(await readProviders(), providerId);
        if (provider && !controller.signal.aborted) setOptions(visibleModels(provider));
        const client = await getProviderClient(providerId);
        const result = await client.models.list({ signal: controller.signal });
        const models = result.data.map((model) => model.id).sort();
        if (controller.signal.aborted) return;
        setOptions(provider ? visibleModels({ ...provider, models }) : models);
      } catch {
        // Cached models and manual entry remain usable when discovery is unavailable.
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();
    return () => controller.abort();
  }, [providerId]);
  return { options, isLoading };
}
