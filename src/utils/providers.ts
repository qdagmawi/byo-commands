export type ProviderKind = "gemini" | "openai" | "compatible";
export type Provider = {
  id: string;
  name: string;
  kind: ProviderKind;
  endpoint: string;
  models: string[];
  favorites: string[];
  hidden: string[];
};
export type ProviderSettings = { version: 1; providers: Provider[]; defaultProviderId?: string };
export const PROVIDERS_KEY = "ai-providers-v1";
export const secretKey = (id: string) => `ai-provider-secret:${id}`;
export const endpoints: Record<ProviderKind, string> = {
  gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
  openai: "https://api.openai.com/v1",
  compatible: "",
};

export function validateEndpoint(endpoint: string) {
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new Error("Enter a valid API base URL.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
    throw new Error("Use HTTPS, or HTTP for a local server.");
  }
  if (url.username || url.password || url.search || url.hash)
    throw new Error("Keep credentials and query parameters out of the endpoint.");
  return endpoint.replace(/\/+$/, "");
}

export function resolveProvider(settings: ProviderSettings, id?: string) {
  const selected = id || settings.defaultProviderId;
  if (!selected) return undefined; // Legacy extension preferences remain usable.
  const provider = settings.providers.find((p) => p.id === selected);
  if (!provider) throw new Error("This provider was removed. Choose another in Models & Providers.");
  return provider;
}

export function visibleModels(provider: Provider) {
  return [...new Set(provider.models)]
    .filter((id) => !provider.hidden.includes(id))
    .sort(
      (a, b) => Number(provider.favorites.includes(b)) - Number(provider.favorites.includes(a)) || a.localeCompare(b),
    );
}
