declare module "subset-font" {
  interface SubsetFontOptions {
    targetFormat?: "sfnt" | "woff" | "woff2" | "truetype";
    noHinting?: boolean;
    noLayoutClosure?: boolean;
  }

  export default function subsetFont(buffer: Buffer, text: string, options?: SubsetFontOptions): Promise<Buffer>;
}
