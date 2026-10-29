export const commandIcons = [
  ["action", "Command"],
  ["pencil", "Writing"],
  ["text", "Text"],
  ["code", "Code"],
  ["checkmark", "Check"],
  ["envelope", "Email"],
  ["bolt", "Quick Action"],
  ["star", "Favorite"],
  ["text-selection", "Selection"],
  ["code-block", "Code Block"],
  ["star-circle", "Ideas"],
  ["text-cursor", "Editing"],
] as const;

export function commandIconPath(icon?: string) {
  const id = commandIcons.some(([id]) => id === icon) ? icon : "action";
  return `command-icons/${id}.png`;
}
