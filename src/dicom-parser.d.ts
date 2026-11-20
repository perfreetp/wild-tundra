declare module 'dicom-parser' {
  export interface Element {
    tag: string;
    vr?: string;
    dataOffset: number;
    length: number;
    encapsulatedPixelData?: boolean;
    fragments?: unknown[];
  }
  export interface ByteArrayParser {
    parseDicom(byteArray: Uint8Array, options?: unknown): DataSet;
  }
  export interface DataSet {
    elements: Record<string, Element>;
    byteArray: Uint8Array;
    string(tag: string): string | undefined;
    uint16(tag: string): number | undefined;
    int16(tag: string): number | undefined;
    intString(tag: string): number | undefined;
    floatString(tag: string): number | undefined;
  }
  export function parseDicom(byteArray: Uint8Array, options?: unknown): DataSet;
}
