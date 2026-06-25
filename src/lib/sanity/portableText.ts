export interface PortableTextBlockLike {
  _type: string;
  _key: string;
  style?: string;
  children?: { text?: string; [key: string]: unknown }[];
  bookAsin?: string;
  [key: string]: unknown;
}

export function asPortableTextBlocks(body: unknown): PortableTextBlockLike[] {
  return Array.isArray(body) ? (body as PortableTextBlockLike[]) : [];
}
