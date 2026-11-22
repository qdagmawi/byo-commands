import { BrowserExtension, Clipboard, getSelectedText } from "@raycast/api";
import { getErrorMessage } from "./error";
import type { BrowserPage } from "./prompt-template";

export async function fetchBrowserPage(): Promise<BrowserPage> {
  const tabs = (await BrowserExtension.getTabs()).filter((tab) => tab.active);
  if (tabs.length !== 1)
    throw new Error("Could not identify a single active browser tab. Paste the webpage content below.");
  const tab = tabs[0];
  const content = await BrowserExtension.getContent({ format: "markdown", tabId: tab.id });
  return { title: tab.title ?? "", url: tab.url, content };
}

export async function fetchContent(source: "clipboard" | "selectedText" | "browserTab") {
  let content: string | null = null;
  let error: string | null = null;

  if (source === "clipboard") {
    content = (await Clipboard.readText()) || null;
  } else if (source === "selectedText") {
    // Retry with a short delay to allow the OS to complete window focus
    // and yield the current selection rather than stale text.
    for (let i = 0; i < 7; i++) {
      try {
        content = await getSelectedText();
        if (content && content.trim().length > 0) {
          error = null;
          break;
        }
      } catch (err) {
        error = getErrorMessage(err, "No text selected. Ensure that the required application is in focus.");
      }
      if (i < 6) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }
  } else {
    try {
      content = await BrowserExtension.getContent({ format: "markdown" });
    } catch (err) {
      const defaultMsg =
        "Could not connect to the Browser Extension. Make sure a Browser Tab is focused and the Raycast browser extension is installed.";
      error = getErrorMessage(err, defaultMsg);
      if (error.startsWith("Could not connect to the Browser Extension.")) {
        // Replace the default message with a more detailed message.
        error = defaultMsg;
      } else if (error.startsWith("Could not get the content of the tab")) {
        error =
          "Could not get the content of the tab. Please check that the Raycast browser extension is installed and enabled. If everything is correct, try reopening the web browser.";
      }
    }
  }

  return { content, error };
}
