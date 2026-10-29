import type { Command } from "../type";

export const COMMAND_SLOT_COUNT = 20;
export const commandSlots = Array.from({ length: COMMAND_SLOT_COUNT }, (_, index) => String(index + 1));
export const slotTitle = (slot: string) => `Command ${slot.padStart(2, "0")}`;

export function commandForSlot(commands: Record<string, Command>, slot: string) {
  return Object.values(commands).find((command) => command.shortcutSlot === slot);
}

export function automaticallyAssignSlot(commands: Record<string, Command>, command: Command): Command {
  const existing = commands[command.id];
  const slot = existing?.shortcutSlot || commandSlots.find((value) => !commandForSlot(commands, value)) || "";
  return { ...command, shortcutSlot: slot };
}

export function validateCommandSlot(commands: Record<string, Command>, command: Command) {
  if (!command.shortcutSlot) return;
  if (!commandSlots.includes(command.shortcutSlot)) throw new Error("Choose a slot from 1 to 20.");
  const assigned = commandForSlot(commands, command.shortcutSlot);
  if (assigned && assigned.id !== command.id) {
    throw new Error(`${slotTitle(command.shortcutSlot)} is assigned to ${assigned.name}. Unassign it first.`);
  }
}
