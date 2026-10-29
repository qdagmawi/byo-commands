import { getPreferenceValues, LocalStorage } from "@raycast/api";
import fetch from "cross-fetch";
import OpenAI from "openai";
import { getConfigUrl } from "../utils";
import type { LegacyConnectionPreferences } from "../utils/legacy-connection";
import { getProxyAgent } from "./useProxy";
import { readProviders } from "../utils/provider-storage";
import { resolveProvider, secretKey } from "../utils/providers";

export async function getProviderClient(providerId?: string): Promise<OpenAI> {
  const provider = resolveProvider(await readProviders(), providerId);
  const preferences = getConfiguration();
  const key = provider ? await LocalStorage.getItem<string>(secretKey(provider.id)) : preferences.apiKey;
  if (!key && provider?.kind !== "compatible") throw new Error("Add an API key in Models & Providers.");
  const endpoint = provider?.endpoint ?? getConfigUrl(preferences);
  const agent = getProxyAgent(endpoint);
  return new OpenAI({
    apiKey: key || "local",
    baseURL: endpoint,
    fetch: (url, init) => fetch(url as string, { ...init, agent } as RequestInit),
  });
}

export function getConfiguration(): Preferences & LegacyConnectionPreferences {
  return getPreferenceValues<Preferences & LegacyConnectionPreferences>();
}
