import mongoose from 'mongoose';

// order:cancelled used to publish ObjectId.id, which JSON turns into a Buffer.
export function readTicketId(value: unknown): string | null {
  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    (value as { type?: unknown }).type === 'Buffer' &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    const data = (value as { data: number[] }).data;
    const bytes = data.every(
      (entry) => Number.isInteger(entry) && entry >= 0 && entry <= 255
    );
    if (bytes && data.length === 12) {
      return Buffer.from(data).toString('hex');
    }
  }

  return null;
}
