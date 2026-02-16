export enum PacketType {
  t = 0x01, //timestamp (Numeric Proccess)
  p = 0x02, //play/pause
  r = 0x03, //rate (Numeric Proccess)
  e = 0x04, //error
  //server related
  c = 0x05, //command for the server
  u = 0x06, //Server notification
  l = 0x07, //latency ping (Numeric Proccess)
  d = 0x08, //drift checker (Numeric Proccess)
  i = 0x09, // User's unique id (reconnect even if room is lock)
}

// SubTypes Defined
export enum Pcmd {
  play = 0x00,
  pause = 0x01,
}

export enum Ecmd {
  nfound = 0x00, //video not found
}

export enum Ccmd {
  open = 0x00, // other people can join
  close = 0x01, // close the room
}

export enum Ucmd {
  joined = 0x00, // user joined
  left = 0x01, // user left
  reconnect = 0x02, // existing user reconnected
}

//-------------------------
// Send (Proccess)
// -----------------------
export const CommandSubEnums = {
  // Their subtypes are limited to defined
  p: Pcmd,
  e: Ecmd,
  c: Ccmd,
  u: Ucmd,
} as const;

// Derived types for maximum type safety
export type CommandPacketKey = keyof typeof CommandSubEnums;

export type NumericPacketKey = Exclude<
  //Their subtypes are basically Unsigned Integar
  keyof typeof PacketType,
  CommandPacketKey
>;

// Union of all valid command strings (e.g. "Start" | "Pause" | "Fix" | ...)
export type CommandValue =
  `${CommandPacketKey}.${keyof (typeof CommandSubEnums)[CommandPacketKey]}`;

//----------------------
// Recieve
// -----------------------

export const VideoEnum = {
  // Needs to apply in Video
  p: Pcmd,
  r: PacketType.r,
  t: PacketType.t,
} as const;

export const PopupEnum = {
  // Needs to show in notification
  u: Ucmd,
  l: PacketType.l,
} as const;

export const ServerEnum = {
  // Send to the server
  c: Ccmd,
  d: PacketType.d,
  i: PacketType.i,
};
