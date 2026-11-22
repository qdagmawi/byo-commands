import {
  Action,
  ActionPanel,
  Application,
  Detail,
  getFrontmostApplication,
  Icon,
  Keyboard,
  LaunchProps,
  Navigation,
  useNavigation,
} from "@raycast/api";
import { useChat } from "../../hooks/useChat";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { canAccessBrowserExtension } from "../../utils/browser";
import { Command, ChatHook, Model } from "../../type";
import { fetchContent, fetchBrowserPage } from "../../utils/cmd-input";
import {
  inspectPromptTemplate,
  renderPromptTemplate,
  TEMPLATE_SYSTEM_PROMPT,
  type PromptContext,
} from "../../utils/prompt-template";
import CommandInputForm from "./input-form";
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
  const [inputContext, setInputContext] = useState<PromptContext>({});
  const [argumentValues, setArgumentValues] = useState<Record<string, string> | null>(null);
  const [argumentNames, setArgumentNames] = useState<string[]>([]);
  const [manualWebpage, setManualWebpage] = useState(false);
  const requestedCommandId = props.launchContext?.commandId || "";
  const [executionModel, setExecutionModel] = useState<Model>();
  const [executionCount, setExecutionCount] = useState(0);
  const started = useRef(false);
  const chatRef = useRef(chat);
  chatRef.current = chat;

  const rerun = useCallback(() => {
    chatRef.current.abort();
    void chatRef.current.clear();
    started.current = false;
    setAiAnswer(null);
    setUserInput(null);
    setUserInputError(null);
    setArgumentValues(null);
    setInputContext({});
    setExecutionCount((c) => c + 1);
  }, []);

  useEffect(() => {
    return () => {
      chatRef.current.abort();
      void chatRef.current.clear();
      started.current = false;
    };
  }, []);

  const lastCommandIdRef = useRef(requestedCommandId);
  useEffect(() => {
    if (lastCommandIdRef.current !== requestedCommandId) {
      lastCommandIdRef.current = requestedCommandId;
      setRequest(undefined);
      rerun();
    }
  }, [requestedCommandId, rerun]);

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
    let active = true;
    (async () => {
      if (!requestedCommand || !requestedModel) {
        return;
      }
      setReadingInput(true);
      try {
        const info = inspectPromptTemplate(requestedModel.prompt);
        setArgumentNames(info.argumentNames);
        let page: PromptContext["browser"];
        let needsPageInput = false;
        if (requestedCommand.contentSource === "browserTab" || info.usesBrowser) {
          if (canAccessBrowserExtension()) {
            try {
              page = await fetchBrowserPage();
            } catch {
              needsPageInput = true;
            }
          } else needsPageInput = true;
        }
        const { content, error } =
          requestedCommand.contentSource === "browserTab"
            ? { content: page?.content ?? null, error: null }
            : await fetchContent(requestedCommand.contentSource);
        const selection =
          info.usesSelection && requestedCommand.contentSource !== "selectedText"
            ? await fetchContent("selectedText")
            : { content, error };
        if (!active) return;
        setInputContext({ selection: selection.content ?? undefined, browser: page });
        setManualWebpage(needsPageInput);
        setUserInput(content);
        setUserInputError(
          error ||
            (info.usesSelection ? selection.error : null) ||
            (!content && !needsPageInput ? "No input available. Select text or choose another input source." : null),
        );
      } catch (error) {
        if (!active) return;
        setUserInputError(error instanceof Error ? error.message : String(error));
      } finally {
        if (active) {
          setReadingInput(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [requestedCommand, executionCount]);

  useEffect(() => {
    if (
      userInput &&
      requestedCommand &&
      requestedModel &&
      !isReadingInput &&
      !manualWebpage &&
      !userInputError &&
      !started.current &&
      (argumentNames.length === 0 || argumentValues)
    ) {
      try {
        const info = inspectPromptTemplate(requestedModel.prompt);
        const model = info.hasTokens ? { ...requestedModel, prompt: TEMPLATE_SYSTEM_PROMPT } : requestedModel;
        const question = info.hasTokens
          ? renderPromptTemplate(requestedModel.prompt, { ...inputContext, arguments: argumentValues ?? {} })
          : userInput;
        started.current = true;
        setExecutionModel(model);
        setAiAnswer(null);
        void chat.ask(question, [], model);
      } catch (error) {
        setUserInputError(error instanceof Error ? error.message : String(error));
      }
    }
  }, [
    userInput,
    requestedCommand,
    requestedModel,
    isReadingInput,
    manualWebpage,
    userInputError,
    argumentNames,
    argumentValues,
    inputContext,
    executionCount,
  ]);

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
  if (!isReadingInput && !userInputError && (manualWebpage || (argumentNames.length > 0 && !argumentValues))) {
    return (
      <CommandInputForm
        title={requestedCommand.name}
        argumentNames={argumentNames}
        manualWebpage={manualWebpage}
        onSubmit={(values) => {
          setArgumentValues(values.arguments);
          if (values.browser) {
            setInputContext((context) => ({ ...context, browser: values.browser }));
            if (requestedCommand.contentSource === "browserTab") setUserInput(values.browser.content);
          }
          setManualWebpage(false);
        }}
      />
    );
  }

  const viewBuilder = new CommandViewBuilder(
    requestedCommand,
    chat,
    navigation,
    frontmostApp,
    userInput,
    aiAnswer,
    userInputError || chat.errorMsg,
    executionModel ?? requestedModel,
    rerun,
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
  onRerun?: () => void;

  constructor(
    command: Command,
    chat: ChatHook,
    navigation: Navigation,
    frontmostApp: Application | null,
    userInput: string | null,
    aiAnswer: string | null,
    error: string | null,
    model: Model,
    onRerun?: () => void,
  ) {
    this.command = command;
    this.model = model;
    this.chat = chat;
    this.navigation = navigation;
    this.frontmostApp = frontmostApp;
    this.userInput = userInput;
    this.aiAnswer = aiAnswer;
    this.error = error;
    this.onRerun = onRerun;
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
    const rerunAction = (
      <Action
        key="startAgain"
        title="Start Again"
        icon={Icon.RotateClockwise}
        shortcut={Keyboard.Shortcut.Common.Refresh}
        onAction={this.onRerun}
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
      if (this.onRerun) {
        mainActions.push(rerunAction);
      }
      extraActions.push(continueInChat);
    } else if (this.error && this.onRerun) {
      mainActions.push(rerunAction);
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
      markdown={`This AI command is no longer available. Open Commands to select or create a command.\n\nCommand ID: ${commandId}`}
    />
  );
}
