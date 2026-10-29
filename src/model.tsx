import { Action, ActionPanel, Icon, Keyboard, List, useNavigation } from "@raycast/api";
import { useState } from "react";
import { DestructiveAction, PinAction } from "./actions";
import { PreferencesActionSection } from "./actions/preferences";
import { DEFAULT_MODEL, useModel } from "./hooks/useModel";
import { Command, Model as ModelType } from "./type";
import { ModelForm } from "./views/model/form";
import { ModelListItem, ModelListView } from "./views/model/list";
import { ExportData, ImportData } from "./utils/import-export";
import { ImportForm } from "./views/import-form";
import { useCommand } from "./hooks/useCommand";
import { commandIdFromModel, commandModelId, isCommandModel } from "./utils/model-catalog";
import { useModelCatalog } from "./hooks/useModelCatalog";
import { CommandForm } from "./views/command/from";
import { EditModelAction } from "./actions/edit-model";
import { CommandManagementActions, RunCommandAction } from "./actions/command";
import Ask from "./ask";
import { CacheAdapter } from "./utils/cache";

export default function Model() {
  const models = useModel();
  const commands = useCommand();
  const { catalog } = useModelCatalog();
  const [searchText, setSearchText] = useState<string>("");
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const { push } = useNavigation();

  const selectCommand = (command: Command) => {
    setSearchText("");
    setSelectedModelId(commandModelId(command.id));
  };
  const createActions = (model?: ModelType) => (
    <ActionPanel.Section title="Create">
      <Action
        title="Create Chat Preset"
        shortcut={Keyboard.Shortcut.Common.New}
        icon={Icon.NewDocument}
        onAction={() =>
          push(
            <ModelForm
              name={searchText}
              onSaved={(created) => {
                setSearchText("");
                setSelectedModelId(created.id);
              }}
            />,
          )
        }
      />
      <Action
        title={model && !isCommandModel(model.id) ? "Create AI Command from This Preset" : "Create AI Command"}
        shortcut={{
          macOS: { modifiers: ["cmd", "shift"], key: "n" },
          Windows: { modifiers: ["ctrl", "shift"], key: "n" },
        }}
        icon={Icon.Bolt}
        onAction={() =>
          push(
            <CommandForm
              name={searchText}
              baseModelId={model && !isCommandModel(model.id) ? model.id : undefined}
              use={{ commands }}
              onSaved={selectCommand}
            />,
          )
        }
      />
    </ActionPanel.Section>
  );
  const getActionPanel = (model: ModelType) => {
    const commandId = commandIdFromModel(model.id);
    const command = commandId ? commands.data[commandId] : undefined;
    return (
      <ActionPanel>
        {command && <RunCommandAction command={command} />}
        <Action
          title={command ? "Ask with This Command" : "Chat with This Preset"}
          icon={Icon.Message}
          onAction={() => {
            if (!command) new CacheAdapter("select_model").set(model.id);
            push(<Ask initialModel={model} />);
          }}
        />
        <EditModelAction modelId={model.id} />
        {createActions(model)}
        {command ? (
          <ActionPanel.Section title="AI Command">
            <CommandManagementActions command={command} onCreated={selectCommand} />
          </ActionPanel.Section>
        ) : (
          <>
            <ActionPanel.Section title="Import and Export">
              <Action
                title="Export Chat Presets"
                icon={Icon.Upload}
                onAction={() => ExportData(catalog.models, "Chat Presets")}
              />
              <Action
                title="Import Chat Presets"
                icon={Icon.Download}
                onAction={() =>
                  push(
                    <ImportForm
                      moduleName="Chat Presets"
                      onSubmit={async (file) => {
                        const imported = await ImportData<ModelType>(
                          "models",
                          file,
                          models.importModels,
                          "Models used by AI commands will be kept if missing from the file. This action cannot be undone.",
                        );
                        return imported !== undefined;
                      }}
                    />,
                  )
                }
              />
            </ActionPanel.Section>
            {model.id !== "default" && (
              <>
                <PinAction
                  title={model.pinned ? "Unpin Model" : "Pin Model"}
                  isPinned={model.pinned}
                  onAction={() => models.setPinned(model.id, !model.pinned).catch(() => {})}
                />
                <ActionPanel.Section title="Delete">
                  <DestructiveAction
                    title="Remove Model"
                    dialog={{ title: "Remove this model from your collection?" }}
                    onAction={() => models.remove(model).catch(() => {})}
                  />
                </ActionPanel.Section>
              </>
            )}
          </>
        )}
        <PreferencesActionSection />
      </ActionPanel>
    );
  };

  const sortedModels = Object.values(models.data).sort(
    (a, b) => new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime(),
  );

  const filteredModels = sortedModels
    .filter((value, index, self) => index === self.findIndex((model) => model.id === value.id))
    .filter((model) => {
      if (searchText === "") {
        return true;
      }
      return (
        model.prompt.toLowerCase().includes(searchText.toLowerCase()) ||
        model.name.toLowerCase().includes(searchText.toLowerCase()) ||
        model.temperature.toLocaleString().toLowerCase().includes(searchText.toLowerCase()) ||
        (model.enableReasoningEffortChange ? model.reasoningEffort.toLowerCase() : "disabled").includes(
          searchText.toLowerCase(),
        )
      );
    });

  const defaultModelOnly = models.data[DEFAULT_MODEL.id] ?? DEFAULT_MODEL;

  const commandModelsOnly = filteredModels.filter((x) => x.id !== DEFAULT_MODEL.id && isCommandModel(x.id));

  const customModelsOnly = filteredModels.filter((x) => x.id !== DEFAULT_MODEL.id && !isCommandModel(x.id));

  return (
    <List
      isShowingDetail // always show detail view, since the default model is always selected
      isLoading={models.isLoading}
      filtering={false}
      throttle={false}
      selectedItemId={selectedModelId || undefined}
      onSelectionChange={(id) => {
        if (id !== selectedModelId) {
          setSelectedModelId(id);
        }
      }}
      navigationTitle="Chat Presets"
      actions={<ActionPanel>{createActions()}</ActionPanel>}
      searchBarPlaceholder="Search models and AI commands..."
      searchText={searchText}
      onSearchTextChange={setSearchText}
    >
      {models.isLoading ? (
        <List.EmptyView />
      ) : (
        <>
          <ModelListItem
            key="default"
            model={defaultModelOnly}
            selectedModel={selectedModelId}
            actionPanel={getActionPanel}
          />
          <ModelListView
            key="pinned"
            title="Pinned"
            models={customModelsOnly.filter((x) => x.pinned)}
            selectedModel={selectedModelId}
            actionPanel={getActionPanel}
          />
          <ModelListView
            key="models"
            title="Chat Presets"
            models={customModelsOnly.filter((x) => !x.pinned)}
            selectedModel={selectedModelId}
            actionPanel={getActionPanel}
          />
          <ModelListView
            key="ai-commands"
            title="AI Commands"
            models={commandModelsOnly}
            selectedModel={selectedModelId}
            actionPanel={getActionPanel}
          />
        </>
      )}
    </List>
  );
}
