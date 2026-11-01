import { Action, ActionPanel, Form } from "@raycast/api";
import { useForm } from "@raycast/utils";
import type { BrowserPage } from "../../utils/prompt-template";

export default function CommandInputForm(props: {
  title: string;
  argumentNames: string[];
  manualWebpage: boolean;
  onSubmit: (result: { arguments: Record<string, string>; browser?: BrowserPage }) => void;
}) {
  const { handleSubmit, itemProps } = useForm<Record<string, string>>({
    initialValues: Object.fromEntries([
      ...props.argumentNames.map((_, i) => [`argument-${i}`, ""]),
      ["pageTitle", ""],
      ["pageUrl", ""],
      ["pageContent", ""],
    ]),
    validation: Object.fromEntries([
      ...props.argumentNames.map((name, i) => [
        `argument-${i}`,
        (value: string) => (value?.trim() ? undefined : `Enter ${name}.`),
      ]),
      ...(props.manualWebpage
        ? [["pageContent", (value: string) => (value?.trim() ? undefined : "Paste the webpage content.")]]
        : []),
    ]),
    onSubmit: (values) =>
      props.onSubmit({
        arguments: Object.fromEntries(props.argumentNames.map((name, i) => [name, values[`argument-${i}`]])),
        browser: props.manualWebpage
          ? { title: values.pageTitle ?? "", url: values.pageUrl ?? "", content: values.pageContent }
          : undefined,
      }),
  });
  return (
    <Form
      navigationTitle={props.title}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Run Command" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      {props.argumentNames.map((name, i) => (
        <Form.TextField key={name} title={name} {...itemProps[`argument-${i}`]} />
      ))}
      {props.manualWebpage && (
        <>
          <Form.Description
            title="Webpage"
            text="Browser capture is unavailable. Paste the page text to use this command; title and URL are optional."
          />
          <Form.TextField title="Page Title" {...itemProps.pageTitle} />
          <Form.TextField title="Page URL" {...itemProps.pageUrl} />
          <Form.TextArea
            title="Page Content"
            placeholder="Paste the article or webpage text…"
            {...itemProps.pageContent}
          />
        </>
      )}
    </Form>
  );
}
