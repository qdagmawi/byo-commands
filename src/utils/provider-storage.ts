import { environment, LocalStorage } from "@raycast/api";
import { Provider, ProviderSettings, PROVIDERS_KEY, secretKey, validateEndpoint } from "./providers";
import { withDirectoryLock } from "./file-lock";

const locked = <T>(action: () => Promise<T>) =>
  withDirectoryLock(environment.supportPath, ".provider-write.lock", action);
export async function readProviders(): Promise<ProviderSettings> {
  const raw = await LocalStorage.getItem<string>(PROVIDERS_KEY);
  if (!raw) return { version: 1, providers: [] };
  const settings = JSON.parse(raw) as ProviderSettings;
  if (settings.version !== 1 || !Array.isArray(settings.providers))
    throw new Error("Unsupported provider configuration.");
  return settings;
}
export async function saveProvider(input: Provider, key?: string) {
  return locked(async () => {
    let provider = { ...input, endpoint: validateEndpoint(input.endpoint) };
    const settings = await readProviders();
    const previous = settings.providers.find((p) => p.id === provider.id);
    const changedEndpoint = previous && previous.endpoint !== provider.endpoint;
    if (previous)
      provider = {
        ...provider,
        models: changedEndpoint ? [] : previous.models,
        favorites: changedEndpoint ? [] : previous.favorites,
        hidden: changedEndpoint ? [] : previous.hidden,
      };
    if (changedEndpoint && !key?.trim()) await LocalStorage.removeItem(secretKey(provider.id));
    if (key?.trim()) await LocalStorage.setItem(secretKey(provider.id), key.trim());
    settings.providers = [...settings.providers.filter((p) => p.id !== provider.id), provider];
    settings.defaultProviderId ??= provider.id;
    await LocalStorage.setItem(PROVIDERS_KEY, JSON.stringify(settings));
  });
}
export async function updateProvider(id: string, update: (current: Provider) => Provider) {
  return locked(async () => {
    const settings = await readProviders();
    const current = settings.providers.find((p) => p.id === id);
    if (!current) throw new Error("Provider no longer exists.");
    const next = update(current);
    if (next.id !== current.id || next.endpoint !== current.endpoint)
      throw new Error("Edit the provider connection in its form.");
    settings.providers = settings.providers.map((p) => (p.id === id ? next : p));
    await LocalStorage.setItem(PROVIDERS_KEY, JSON.stringify(settings));
  });
}
export async function setDefaultProvider(id: string) {
  return locked(async () => {
    const settings = await readProviders();
    if (!settings.providers.some((p) => p.id === id)) throw new Error("Provider no longer exists.");
    await LocalStorage.setItem(PROVIDERS_KEY, JSON.stringify({ ...settings, defaultProviderId: id }));
  });
}
export async function removeProvider(id: string) {
  return locked(async () => {
    const settings = await readProviders();
    if (settings.defaultProviderId === id) throw new Error("Choose another default provider before removing this one.");
    await LocalStorage.setItem(
      PROVIDERS_KEY,
      JSON.stringify({ ...settings, providers: settings.providers.filter((p) => p.id !== id) }),
    );
    await LocalStorage.removeItem(secretKey(id));
  });
}
