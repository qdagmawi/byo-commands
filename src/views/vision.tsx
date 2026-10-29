import { Action, ActionPanel, Detail, Toast, getPreferenceValues, showToast } from "@raycast/api";
import { Stream } from "openai/streaming";
import { useEffect, useState } from "react";

import { getProviderClient } from "../hooks/api-client";
import { modelCatalog } from "../hooks/useModelCatalog";
import { AskImageProps } from "../type";
import { toUnit } from "../utils";
import { LoadFrom, loadFromClipboard, loadFromFinder } from "../utils/load";

function bufferToDataUrl(mimeType: string, buffer: Buffer) {
  const base64String = buffer.toString("base64");
  return `data:${mimeType};base64,${base64String}`;
}

export function VisionView(props: AskImageProps) {
  const [useStream] = useState<boolean>(() => {
    return getPreferenceValues<{
      useStream: boolean;
    }>().useStream;
  });

  const { user_prompt, toast_title, load } = props;
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(true);

  const [imageMeta, setImageMeta] = useState<{ height: number; width: number; size: number }>({
    height: 0,
    width: 0,
    size: 0,
  });

  async function getChatResponse(prompt: string) {
    try {
      let data: LoadFrom | undefined;

      if (load === "selected") {
        data = await loadFromFinder();
      } else {
        data = await loadFromClipboard();
      }

      let imageUrl = "";
      if (!data) {
        await showToast({ style: Toast.Style.Failure, title: "Error" });
        setLoading(false);
        setResponse("## ⚠️ Data couldn't load. Check image selection or clipboard and try again.");
        return;
      }
      imageUrl = bufferToDataUrl(`image/${data.type.type === "jpg" ? "jpeg" : data.type.type}`, data.data);

      await modelCatalog.load();
      const defaultModel = modelCatalog.getSnapshot().catalog.models.default;
      const client = await getProviderClient(defaultModel?.providerId);
      const streamOrCompletion = await client.chat.completions.create({
        model: props.model_override || defaultModel.option,
        stream: useStream,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant. Answer questions about the supplied image.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${prompt ? prompt : "Describe this image:"}`,
              },
              {
                type: "image_url",
                image_url: { url: imageUrl },
              },
            ],
          },
        ],
      });

      const imageWidth = data.type.width;
      const imageHeight = data.type.height;
      setImageMeta({ height: imageHeight, width: imageWidth, size: data.data.length });
      return streamOrCompletion;
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "Error" });
      setLoading(false);
      setResponse(
        "## ⚠️ Issue when accessing the API. \n\n" + `Error Message: \n\n \`\`\`${(error as Error).message}\`\`\``,
      );
      return;
    }
  }

  async function getResult() {
    const now = new Date();
    let duration = 0;
    const toast = await showToast(Toast.Style.Animated, toast_title);

    const resp = await getChatResponse(user_prompt);
    if (!resp) return;

    let response_ = "";
    function appendResponse(part: string) {
      response_ += part;
      setResponse(response_);
    }

    if (resp instanceof Stream) {
      for await (const part of resp) {
        appendResponse(part.choices[0]?.delta?.content ?? "");
      }
    } else {
      appendResponse(resp.choices[0]?.message?.content ?? "");
    }

    setLoading(false);
    const done = new Date();
    duration = (done.getTime() - now.getTime()) / 1000;
    toast.style = Toast.Style.Success;
    toast.title = `Finished in ${duration} seconds`;
  }

  useEffect(() => {
    getResult();
  }, []);

  return (
    <Detail
      markdown={response}
      isLoading={loading}
      actions={
        !loading && (
          <ActionPanel title="Actions">
            <Action.CopyToClipboard title="Copy Results" content={response} />
            <Action.Paste title="Paste Results" content={response} />
          </ActionPanel>
        )
      }
      metadata={
        imageMeta.size || imageMeta.width || imageMeta.height ? (
          <Detail.Metadata>
            {imageMeta.size > 0 && <Detail.Metadata.Label title="Size" text={toUnit(imageMeta.size)} />}
            {imageMeta.width > 0 && <Detail.Metadata.Label title="Width" text={String(imageMeta.width)} />}
            {imageMeta.height > 0 && <Detail.Metadata.Label title="Height" text={String(imageMeta.height)} />}
          </Detail.Metadata>
        ) : null
      }
    />
  );
}
