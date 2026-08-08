declare module 'culori' {
  export function parse(color: string): unknown;
  export function formatHex(color: unknown): string | undefined;
  export function converter(mode: string): (color: unknown) => { l?: number; c?: number; h?: number; mode?: string };
}

declare module 'wcag-contrast' {
  export function hex(a: string, b: string): number;
}
