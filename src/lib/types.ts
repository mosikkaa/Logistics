/** Plain objects that are safe to send to Client Components. */

export type LogistRef = { id: number; name: string; color: string };

export type DestinationRef = { id: number; code: string; name: string };

export type DriverDTO = {
  id: number;
  phone: string; // E.164
  name: string;
  truckType: string;
  description: string | null;
  logist: LogistRef;
  destinations: DestinationRef[];
  createdAt: string; // ISO
};

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? object : { data: T }))
  | { ok: false; error: string; fieldErrors?: Record<string, string> };
