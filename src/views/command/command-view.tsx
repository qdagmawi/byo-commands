import {
  Action,
  ActionPanel,
  Application,
  Detail,
  getFrontmostApplication,
  Icon,
  Keyboard,
  LaunchProps,
  List,
  Navigation,
  open,
  useNavigation,
} from "@raycast/api";
import { useChat } from "../../hooks/useChat";
import React, { useEffect, useState } from "react";
import { canAccessBrowserExtension } from "../../utils/browser";
import { PrimaryAction } from "../../actions";
import { Command, ChatHook, Model } from "../../type";
import { fetchContent } from "../../utils/cmd-input";
import Ask from "../../ask";
import { v4 as uuidv4 } from "uuid";
import { useCommand } from "../../hooks/useCommand";
import type { NativeOverrides } from "./native-entry";

type CommandLaunchContext = { commandId?: string };
export type CommandLaunchProps = LaunchProps<{ launchContext?: CommandLaunchContext }> & {
  overrides?: NativeOverrides;
};

export default function CommandView(props: CommandLaunchProps) {
  const navigation = useNavigation();
  const commands = useCommand();
  const chat = useChat([]);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string | null>(null);
  const [userInputError, setUserInputError] = useState<string | null>(null);
  const [isReadingInput, setReadingInput] = useState(true);
  const [frontmostApp, setFrontmostApp] = useState<Application | null>(null);

  const requestedCommandId = props.launchContext?.commandId || "";
  const [request, setRequest] = useState<{ command: Command; model: Model }>();
  const requestedCommand = request?.command;
  const requestedModel = request?.model;
  useEffect(() => {
    const command = commands.data[requestedCommandId];
    if (!commands.isLoading && command && !request) {
      const model = commands.resolveModel(command);
      const overrides = props.overrides;
      if (overrides?.aiProviderOverride && overrides.aiProviderOverride !== "saved")
        model.providerId = overrides.aiProviderOverride === "default" ? undefined : overrides.aiProviderOverride;
      if (overrides?.aiPromptOverride?.trim()) model.prompt = overrides.aiPromptOverride;
      if (overrides?.aiModelOverride?.trim()) model.option = overrides.aiModelOverride.trim();
      if (overrides?.aiTemperatureOverride?.trim()) {
        const temperature = Number(overrides.aiTemperatureOverride);
        if (Number.isFinite(temperature) && temperature >= 0 && temperature <= 2)
          model.temperature = String(temperature);
      }
      const source = overrides?.aiSourceOverride;
      setRequest({
        command: {
          ...command,
          contentSource: source && source !== "saved" ? source : command.contentSource,
          model: model.option,
        },
        model,
      });
    }
  }, [commands.isLoading, commands.data, requestedCommandId, request]);

  useEffect(() => {
    getFrontmostApplication()
      .then(setFrontmostApp)
      .catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      if (!requestedCommand) {
        return;
      }
      setReadingInput(true);
      try {
        const { content, error } = await fetchContent(requestedCommand.contentSource);
        setUserInput(content);
        setUserInputError(
          error || (!content ? "No input available. Select text or choose another input source." : null),
        );
      } catch (error) {
        setUserInputError(error instanceof Error ? error.message : String(error));
      } finally {
        setReadingInput(false);
      }
    })();
  }, [requestedCommand]);

  useEffect(() => {
    if (userInput && requestedCommand && requestedModel) {
      setAiAnswer(null);
      chat.ask(userInput, [], requestedModel);
    }
  }, [userInput, requestedCommand]);

  useEffect(() => {
    if (!chat.streamData && !chat.isLoading && chat.data.length > 0) {
      const lastChat = chat.data[chat.data.length - 1];
      setAiAnswer(lastChat.answer);
    } else {
      setAiAnswer(chat.streamData?.answer || null);
    }
  }, [chat.streamData, chat.isLoading, chat.data]);

  if (!commands.isLoading && !commands.data[requestedCommandId] && !request) {
    return buildCommandNotFoundView(requestedCommandId);
  }
  if (!requestedCommand || !requestedModel) {
    return <Detail isLoading markdown="" />;
  }
  if (requestedCommand.contentSource === "browserTab" && !canAccessBrowserExtension()) {
    return BROWSER_EXTENSION_NOT_AVAILABLE_VIEW;
  }

  const viewBuilder = new CommandViewBuilder(
    requestedCommand,
    chat,
    navigation,
    frontmostApp,
    userInput,
    aiAnswer,
    userInputError || chat.errorMsg,
    requestedModel,
  );

  return (
    <Detail
      navigationTitle={requestedCommand.name}
      isLoading={isReadingInput || chat.isLoading}
      markdown={viewBuilder.buildContent()}
      actions={viewBuilder.buildActionPanel()}
    />
  );
}

class CommandViewBuilder {
  command: Command;
  model: Model;
  chat: ChatHook;
  navigation: Navigation;
  frontmostApp: Application | null;
  userInput: string | null;
  aiAnswer: string | null;
  error: string | null;

  constructor(
    command: Command,
    chat: ChatHook,
    navigation: Navigation,
    frontmostApp: Application | null,
    userInput: string | null,
    aiAnswer: string | null,
    error: string | null,
    model: Model,
  ) {
    this.command = command;
    this.model = model;
    this.chat = chat;
    this.navigation = navigation;
    this.frontmostApp = frontmostApp;
    this.userInput = userInput;
    this.aiAnswer = aiAnswer;
    this.error = error;
  }

  buildContent(): string {
    if (this.error) return [this.aiAnswer, "## Couldn’t complete the command", this.error].filter(Boolean).join("\n\n");
    if (this.chat.isAborted) return [this.aiAnswer, "*Stopped.*"].filter(Boolean).join("\n\n");
    return this.aiAnswer || "";
  }

  buildActionPanel(): React.JSX.Element {
    const cancel = <Action key="cancel" title="Cancel" icon={Icon.Stop} onAction={this.chat.abort} />;
    const pasteToActiveApp = (
      <Action.Paste
        key="pasteToActiveApp"
        title={`Paste Response to ${this.frontmostApp ? this.frontmostApp.name : "Active App"}`}
        content={this.aiAnswer || ""}
        icon={this.frontmostApp ? { fileIcon: this.frontmostApp.path } : Icon.AppWindow}
      />
    );
    const copyToClipboard = (
      <Action.CopyToClipboard
        key="copyToClipboard"
        title={`Copy Response`}
        shortcut={Keyboard.Shortcut.Common.Copy}
        content={this.aiAnswer || ""}
      />
    );
    const continueInChat = (
      <Action
        key="continueInChat"
        title="Continue in Chat"
        icon={Icon.Message}
        onAction={() => {
          this.navigation.push(
            <Ask
              conversation={{
                id: uuidv4(),
                chats: this.chat.data,
                model: this.model,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                pinned: false,
              }}
            />,
          );
        }}
        shortcut={{ macOS: { modifiers: ["cmd"], key: "j" }, Windows: { modifiers: ["ctrl"], key: "j" } }}
      />
    );

    const mainActions: React.JSX.Element[] = [];
    const extraActions: React.JSX.Element[] = [];
    if (this.chat.isLoading) {
      mainActions.push(cancel);
    } else if (this.aiAnswer) {
      if (this.command.contentSource === "selectedText") {
        mainActions.push(pasteToActiveApp);
        mainActions.push(copyToClipboard);
      } else {
        mainActions.push(copyToClipboard);
      }
      extraActions.push(continueInChat);
    }

    if (this.command.isDisplayInput && this.userInput) {
      extraActions.push(
        <Action
          key="original-input"
          title="View Original Input"
          icon={Icon.TextSelection}
          onAction={() => {
            const ticks = Array.from(this.userInput!.matchAll(/`+/g), (match) => match[0].length);
            const fence = "\x60".repeat(Math.max(3, ...ticks.map((length) => length + 1)));
            this.navigation.push(
              <Detail
                navigationTitle="Original Input"
                markdown={fence + "\n" + this.userInput + "\n" + fence}
                actions={
                  <ActionPanel>
                    <Action.CopyToClipboard title="Copy Original Input" content={this.userInput || ""} />
                  </ActionPanel>
                }
              />,
            );
          }}
        />,
      );
    }
    extraActions.push(<Action.CopyToClipboard key="model-info" title="Copy Model ID" content={this.model.option} />);
    return (
      <ActionPanel>
        <ActionPanel.Section>{mainActions}</ActionPanel.Section>
        {extraActions.length > 0 ? <ActionPanel.Section>{extraActions}</ActionPanel.Section> : null}
      </ActionPanel>
    );
  }
}

function buildCommandNotFoundView(commandId: string) {
  return (
    <Detail
      markdown={`This AI command is no longer available. Open AI Commands to select or create a command.\n\nCommand ID: ${commandId}`}
    />
  );
}

const BROWSER_EXTENSION_NOT_AVAILABLE_VIEW = (
  <List
    actions={
      <ActionPanel>
        <PrimaryAction title="Install" onAction={() => open("https://www.raycast.com/browser-extension")} />
      </ActionPanel>
    }
  >
    <List.EmptyView
      icon={Icon.BoltDisabled}
      title={"Browser Extension Required"}
      description={"This command need install Raycast browser extension to work. Please install it first"}
    />
  </List>
);
