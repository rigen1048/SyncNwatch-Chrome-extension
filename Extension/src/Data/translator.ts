import {
  PacketType,
  CommandSubEnums,
  type CommandPacketKey,
  type NumericPacketKey,
} from "./type";
import { sendBinary } from "../components/websocket"; // ← Only new import

// ─────────────────────────────────────────────────────────────────────────────
// Public translator – type-safe overloads (external API)
// ─────────────────────────────────────────────────────────────────────────────
export function translator(type: NumericPacketKey, value: number): Uint8Array;
export function translator(type: CommandPacketKey, value: string): Uint8Array;
export function translator(
  type: NumericPacketKey | CommandPacketKey,
  value: string | number,
): Uint8Array {
  return translatorInternal(type as keyof typeof PacketType, value);
}
// ─────────────────────────────────────────────────────────────────────────────
// Internal implementation – correct lengths + fixes TS2352 properly
// ─────────────────────────────────────────────────────────────────────────────
function translatorInternal(
  type: keyof typeof PacketType,
  value: string | number,
): Uint8Array {
  console.log(`[translator] ${type}|${value}`); // message has shown here
  const packetTypeValue = PacketType[type];
  if (packetTypeValue === undefined) {
    throw new Error(`Unknown packet type: "${type}"`);
  }
  const typeByte = packetTypeValue & 0xff;
  const subEnum = CommandSubEnums[type as CommandPacketKey];
  if (subEnum !== undefined) {
    // ───── Command packet: 2 bytes ─────
    if (typeof value !== "string") {
      throw new Error(
        `Packet type "${type}" expects a command string, got ${typeof value}`,
      );
    }
    const enumValue = subEnum[value as keyof typeof subEnum];
    if (enumValue === undefined) {
      const valid = Object.keys(subEnum).join('", "');
      throw new Error(
        `Invalid command "${value}" for "${type}". Valid: "${valid}"`,
      );
    }
    // Fix TS2352 the proper, recommended way (same as your original working code)
    const subByte = enumValue as unknown as number;
    return new Uint8Array([typeByte, subByte]);
  }
  // ───── Numeric packet: 3 bytes ─────
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 0xffff
  ) {
    throw new Error(
      `Numeric value for "${type}" must be integer 0–65535, got ${value}`,
    );
  }
  const high = (value >> 8) & 0xff;
  const low = value & 0xff;
  return new Uint8Array([typeByte, high, low]);
}
// ─────────────────────────────────────────────────────────────────────────────
// sendPacket – fully type-safe public API
// ─────────────────────────────────────────────────────────────────────────────
export function sendPacket(type: NumericPacketKey, value: number): void;
export function sendPacket(type: CommandPacketKey, value: string): void;
export function sendPacket(
  type: NumericPacketKey | CommandPacketKey,
  value: string | number,
): void {
  const packet =
    typeof value === "string"
      ? translator(type as CommandPacketKey, value)
      : translator(type as NumericPacketKey, value);
  // Send via WebSocket instead of chrome.runtime messaging
  console.log(`[translator] ${packet}`); //No message is showing here
  sendBinary(packet);
}
