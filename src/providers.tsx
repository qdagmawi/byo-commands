import {
  Action,
  ActionPanel,
  Form,
  Icon,
  Keyboard,
  List,
  showToast,
  Toast,
  useNavigation,
  confirmAlert,
  Alert,
} from "@raycast/api";
import { useEffect, useRef, useState } from "react";
import { randomUUID } from "node:crypto";
import { Provider, ProviderKind, endpoints, visibleModels } from "./utils/providers";
import {
  readProviders,
  saveProvider,
  setDefaultProvider,
  removeProvider,
  updateProvider,
} from "./utils/provider-storage";
import { useProviders } from "./hooks/useProviders";
import { getProviderClient } from "./hooks/api-client";
import { modelCatalog, useModelCatalog } from "./hooks/useModelCatalog";

async function report(action: () => Promise<void>, title: string) {
  const toast = await showToast({ style: Toast.Style.Animated, title });
  try {
    await action();
    toast.style = Toast.Style.Success;
  } catch (error) {
    toast.style = Toast.Style.Failure;
    toast.title = "Could not complete action";
    toast.message = error instanceof Error ? error.message : String(error);
  }
}

export default function Providers() {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const { settings, isLoading, reload } = useProviders();
  const { push } = useNavigation();
  const { catalog } = useModelCatalog();
  const onProviderSaved = async (id: string) => {
    await reload();
    await modelCatalog.load();
    push(<ProviderModels providerId={id} />);
  };
  const add = () => push(<ProviderForm onSaved={onProviderSaved} />);
  return (
    <List
      navigationTitle="Models & Providers"
      isLoading={isLoading}
      searchBarPlaceholder="Search providers…"
      selectedItemId={selectedProviderId ?? undefined}
      onSelectionChange={setSelectedProviderId}
    >
      <List.EmptyView
        title="Connect your first provider"
        description="Add your Gemini key, choose a model, then create an AI command."
        icon={Icon.Key}
        actions={
          <ActionPanel>
            <Action title="Add Provider" onAction={add} />
          </ActionPanel>
        }
      />
      {settings.providers.map((provider) => (
        <List.Item
          key={provider.id}
          id={provider.id}
          title={provider.name}
          subtitle={provider.kind === "compatible" ? "OpenAI-compatible" : provider.kind}
          icon={Icon.Key}
          accessories={[
            ...(settings.defaultProviderId === provider.id ? [{ tag: "Default" }] : []),
            { text: `${provider.models.length} models` },
            ...(catalog.models.default?.providerId === provider.id ? [{ text: catalog.models.default.option }] : []),
          ]}
          actions={
            <ActionPanel>
              <Action
                title="Choose Default Model"
                icon={Icon.List}
                onAction={() => push(<ProviderModels providerId={provider.id} />)}
              />
              <Action
                title="Edit Provider"
                icon={Icon.Pencil}
                shortcut={Keyboard.Shortcut.Common.Edit}
                onAction={() => push(<ProviderForm provider={provider} onSaved={onProviderSaved} />)}
              />
              <Action
                title="Test Connection & Refresh Models"
                icon={Icon.ArrowClockwise}
                onAction={() =>
                  report(async () => {
                    await refreshModels(provider.id);
                    await reload();
                  }, "Testing connection")
                }
              />
              <Action
                title="Use as Default Provider"
                icon={Icon.Checkmark}
                onAction={() => push(<ProviderModels providerId={provider.id} />)}
              />
              <Action title="Add Provider" icon={Icon.Plus} shortcut={Keyboard.Shortcut.Common.New} onAction={add} />
              <Action
                title="Remove Provider"
                style={Action.Style.Destructive}
                icon={Icon.Trash}
                onAction={async () => {
                  if (
                    await confirmAlert({
                      title: `Remove ${provider.name}?`,
                      message: "Commands that explicitly use this provider will need another provider.",
                      primaryAction: { title: "Remove", style: Alert.ActionStyle.Destructive },
                    })
                  )
                    await report(async () => {
                      await removeProvider(provider.id);
                      await reload();
                    }, "Provider removed");
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

async function refreshModels(id: string) {
  const settings = await readProviders();
  const provider = settings.providers.find((p) => p.id === id);
  if (!provider) throw new Error("Provider no longer exists.");
  const client = await getProviderClient(id);
  const result = await client.models.list();
  await updateProvider(id, (current) => {
    if (current.endpoint !== provider.endpoint) return current;
    return { ...current, models: [...new Set(result.data.map((m) => m.id))].sort() };
  });
}

function ProviderForm({ provider, onSaved }: { provider?: Provider; onSaved: (id: string) => Promise<void> }) {
  const { pop } = useNavigation();
  const [kind, setKind] = useState<ProviderKind>(provider?.kind ?? "gemini");
  const [name, setName] = useState(provider?.name ?? "Gemini");
  const [endpoint, setEndpoint] = useState(provider?.endpoint ?? endpoints.gemini);
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(provider && provider.endpoint.replace(/\/+$/, "") !== endpoints[provider.kind].replace(/\/+$/, "")),
  );
  const [key, setKey] = useState("");
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  return (
    <Form
      navigationTitle={provider ? "Edit Provider" : "Add Provider"}
      isLoading={saving}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Provider"
            icon={Icon.SaveDocument}
            onSubmit={async () => {
              if (!name.trim()) {
                setError("Enter a provider name.");
                return;
              }
              if ((!provider || endpoint !== provider.endpoint) && !key.trim() && kind !== "compatible") {
                setError("Enter an API key for this endpoint.");
                return;
              }
              setSaving(true);
              try {
                const providerId = provider?.id ?? randomUUID();
                await saveProvider(
                  {
                    id: providerId,
                    name: name.trim(),
                    kind,
                    endpoint,
                    models: provider?.models ?? [],
                    favorites: provider?.favorites ?? [],
                    hidden: provider?.hidden ?? [],
                  },
                  key,
                );
                pop();
                await onSaved(providerId);
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              } finally {
                setSaving(false);
              }
            }}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown
        id="kind"
        title="Provider Type"
        value={kind}
        onChange={(value) => {
          const next = value as ProviderKind;
          if (next === kind) return;
          setKind(next);
          setEndpoint(endpoints[next]);
          setKey("");
          setName(next === "gemini" ? "Gemini" : next === "openai" ? "OpenAI" : "Custom Provider");
          setShowAdvanced(false);
        }}
      >
        <Form.Dropdown.Item value="gemini" title="Google Gemini" />
        <Form.Dropdown.Item value="openai" title="OpenAI / ChatGPT Models" />
        <Form.Dropdown.Item value="compatible" title="OpenAI-compatible / Local" />
      </Form.Dropdown>
      <Form.TextField id="name" title="Name" value={name} onChange={setName} />
      {kind !== "compatible" && (
        <Form.Checkbox
          id="advancedConnection"
          title="Advanced"
          label="Use a custom API endpoint"
          value={showAdvanced}
          onChange={(value) => {
            setShowAdvanced(value);
            if (!value) setEndpoint(endpoints[kind]);
          }}
        />
      )}
      {(kind === "compatible" || showAdvanced) && (
        <Form.TextField
          id="endpoint"
          title="API Base URL"
          value={endpoint}
          onChange={setEndpoint}
          info="Use the API base URL, without /chat/completions. Keys are only sent to this endpoint."
        />
      )}
      <Form.PasswordField
        id="key"
        title="API Key"
        value={key}
        onChange={setKey}
        placeholder={provider ? "Leave blank to keep the saved key" : "Paste your provider API key"}
      />
      {error && <Form.Description title="Could Not Save" text={error} />}
      <Form.Description
        title="Storage"
        text="Keys stay in Raycast’s encrypted local storage. They are not written to command launchers or included in model exports."
      />
    </Form>
  );
}

function ProviderModels({ providerId }: { providerId: string }) {
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const { settings, isLoading, reload } = useProviders();
  const { catalog } = useModelCatalog();
  const [isRefreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState("");
  const attempted = useRef(false);
  const [query, setQuery] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const provider = settings.providers.find((p) => p.id === providerId);
  const ids = provider ? (showHidden ? provider.models : visibleModels(provider)) : [];
  const defaultModel = catalog.models.default;
  const loadModels = async () => {
    setRefreshing(true);
    setLoadError("");
    try {
      await refreshModels(providerId);
      await reload();
    } catch (error) {
      setLoadError("Could not fetch models. Check the provider key/endpoint, retry, or enter a model ID below.");
      await showToast({
        style: Toast.Style.Failure,
        title: "Could not fetch models",
        message:
          error instanceof Error
            ? [error.message, error.cause instanceof Error ? error.cause.message : ""].filter(Boolean).join(" ")
            : String(error),
      });
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    if (!provider || attempted.current) return;
    attempted.current = true;
    void loadModels();
  }, [provider]);
  async function chooseDefault(id: string) {
    await modelCatalog.load();
    await modelCatalog.saveDefaultSelection(providerId, id);
    await setDefaultProvider(providerId);
    await reload();
  }
  async function updateModel(id: string, field: "favorites" | "hidden") {
    await updateProvider(providerId, (current) => ({
      ...current,
      [field]: current[field].includes(id) ? current[field].filter((m) => m !== id) : [...current[field], id],
    }));
    await reload();
  }
  const refresh = loadModels;
  return (
    <List
      navigationTitle={provider ? `${provider.name} — Choose Default Model` : "Choose Default Model"}
      isLoading={isLoading || isRefreshing}
      searchText={query}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="Search or enter a model ID…"
      selectedItemId={selectedModelId ?? undefined}
      onSelectionChange={setSelectedModelId}
    >
      <List.EmptyView
        title="Load available models"
        description="Refresh the model list, or type an exact model ID to add it manually."
        actions={
          <ActionPanel>
            <Action title="Refresh Models" onAction={refresh} />
            <Action title="Show Hidden Models" onAction={() => setShowHidden(true)} />
          </ActionPanel>
        }
      />
      {ids.map((id) => (
        <List.Item
          key={id}
          id={id}
          title={id}
          icon={provider?.favorites.includes(id) ? Icon.Star : Icon.ComputerChip}
          subtitle={
            defaultModel?.providerId === providerId && defaultModel.option === id
              ? "Default model"
              : "Press Enter to set as default"
          }
          accessories={
            provider?.hidden.includes(id)
              ? [{ tag: "Hidden" }]
              : defaultModel?.providerId === providerId && defaultModel.option === id
                ? [{ icon: Icon.Checkmark }]
                : []
          }
          actions={
            <ActionPanel>
              <Action
                title="Use as Default Model"
                icon={Icon.Checkmark}
                onAction={() =>
                  report(async () => {
                    await chooseDefault(id);
                  }, "Default model updated")
                }
              />
              <Action
                title={provider?.favorites.includes(id) ? "Unfavorite Model" : "Favorite Model"}
                icon={Icon.Star}
                onAction={() => report(() => updateModel(id, "favorites"), "Model updated")}
              />
              <Action
                title={provider?.hidden.includes(id) ? "Show Model" : "Hide Model"}
                icon={Icon.Eye}
                onAction={() => report(() => updateModel(id, "hidden"), "Model updated")}
              />
              <Action title="Refresh Models" icon={Icon.ArrowClockwise} onAction={refresh} />
              <Action
                title={showHidden ? "Hide Hidden Models" : "Show Hidden Models"}
                onAction={() => setShowHidden(!showHidden)}
              />
            </ActionPanel>
          }
        />
      ))}
      {provider && query.trim() && !provider.models.includes(query.trim()) && (
        <List.Item
          title={`Add “${query.trim()}”`}
          subtitle="Manual model ID"
          icon={Icon.Plus}
          actions={
            <ActionPanel>
              <Action
                title="Use as Default Model"
                onAction={() =>
                  report(async () => {
                    await updateProvider(providerId, (latest) => ({
                      ...latest,
                      models: [...new Set([...latest.models, query.trim()])],
                    }));
                    await chooseDefault(query.trim());
                  }, "Default model updated")
                }
              />
            </ActionPanel>
          }
        />
      )}
      <List.Section title={loadError || (isRefreshing ? "Loading models…" : "Model controls")}>
        <List.Item
          title="Refresh Models"
          subtitle="Fetch the model list from this provider"
          icon={Icon.ArrowClockwise}
          actions={
            <ActionPanel>
              <Action title="Refresh Models" onAction={refresh} />
            </ActionPanel>
          }
        />
        <List.Item
          title={showHidden ? "Hide Hidden Models" : "Show Hidden Models"}
          icon={Icon.Eye}
          actions={
            <ActionPanel>
              <Action title="Toggle Hidden Models" onAction={() => setShowHidden(!showHidden)} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}
