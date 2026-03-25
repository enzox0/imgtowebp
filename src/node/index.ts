import { readFile } from "node:fs/promises"
import sharp from "sharp"

export type ImageToWebpInput = Buffer | Uint8Array | ArrayBuffer | string

export type ImageToWebpOptions = {
  /**
   * Hard cap for output dimensions, preserving aspect ratio.
   * If the input is larger, it will be downscaled.
   */
  maxWidth?: number
  maxHeight?: number

  /**
   * Target maximum output size in bytes.
   * If provided, the encoder will try to reach <= targetBytes by reducing quality.
   */
  targetBytes?: number

  /**
   * Quality search range (0..1). Higher is better quality, larger file.
   */
  maxQuality?: number
  minQuality?: number

  /**
   * If true, always return WebP even if it can't reach targetBytes.
   * If false, will return the original input when WebP isn't supported.
   */
  force?: boolean

  /**
   * Optional output filename (only used when returning a File).
   */
  fileName?: string

  /**
   * Return a File instead of a Blob (only if global File exists).
   */
  returnFile?: boolean
}

export type ImageToWebpResult = {
  blob: Blob
  file?: File
  width: number
  height: number
  quality: number
  /**
   * True if output is `image/webp`.
   */
  isWebp: boolean
}

const DEFAULTS: Required<
  Pick<
    ImageToWebpOptions,
    "maxWidth" | "maxHeight" | "maxQuality" | "minQuality" | "force" | "returnFile"
  >
> = {
  maxWidth: 2048,
  maxHeight: 2048,
  maxQuality: 0.82,
  minQuality: 0.45,
  force: true,
  returnFile: false,
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function quality01ToSharpQ(q: number): number {
  return Math.max(1, Math.min(100, Math.round(clamp01(q) * 100)))
}

function toUint8Array(input: Exclude<ImageToWebpInput, string>): Uint8Array {
  if (typeof Buffer !== "undefined" && Buffer.isBuffer(input)) return new Uint8Array(input)
  if (input instanceof Uint8Array) return input
  return new Uint8Array(input)
}

async function inputToBytes(input: ImageToWebpInput): Promise<Uint8Array> {
  if (typeof input !== "string") return toUint8Array(input)

  if (/^https?:\/\//i.test(input)) {
    const res = await fetch(input)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`)
    const ab = await res.arrayBuffer()
    return new Uint8Array(ab)
  }

  const buf = await readFile(input)
  return new Uint8Array(buf)
}

function makeBlob(bytes: Uint8Array, type: string): Blob {
  if (typeof Blob !== "function") {
    throw new Error("Global Blob is not available (requires Node.js 18+).")
  }
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy], { type })
}

function maybeMakeFile(bytes: Uint8Array, name: string, type: string): File | undefined {
  if (typeof File !== "function") return undefined
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new File([copy], name, { type })
}

function defaultFileName(fileName?: string) {
  return fileName && fileName.trim().length > 0 ? fileName : "image.webp"
}

function computeTargetSize(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  if (srcW <= 0 || srcH <= 0) return { width: srcW, height: srcH }
  const scale = Math.min(1, maxW / srcW, maxH / srcH)
  return {
    width: Math.max(1, Math.round(srcW * scale)),
    height: Math.max(1, Math.round(srcH * scale)),
  }
}

async function encodeWithSharpWebp(
  inputBytes: Uint8Array,
  width: number,
  height: number,
  quality01: number
): Promise<Uint8Array> {
  const q = quality01ToSharpQ(quality01)
  const out = await sharp(inputBytes)
    .resize({
      width,
      height,
      fit: "fill",
      withoutEnlargement: true,
    })
    .webp({ quality: q })
    .toBuffer()
  return new Uint8Array(out)
}

/**
 * Node implementation (sharp) of image->WebP conversion.
 */
export async function imageToWebp(
  input: ImageToWebpInput,
  options: ImageToWebpOptions = {}
): Promise<ImageToWebpResult> {
  const opts = { ...DEFAULTS, ...options }
  const bytes = await inputToBytes(input)

  const meta = await sharp(bytes).metadata()
  const srcW = meta.width ?? 0
  const srcH = meta.height ?? 0
  const { width, height } = computeTargetSize(srcW, srcH, opts.maxWidth, opts.maxHeight)

  const type = "image/webp"

  if (!opts.targetBytes || opts.targetBytes <= 0) {
    const outBytes = await encodeWithSharpWebp(bytes, width, height, opts.maxQuality)
    const blob = makeBlob(outBytes, type)
    const file = opts.returnFile ? maybeMakeFile(outBytes, defaultFileName(opts.fileName), type) : undefined
    return { blob, file, width, height, quality: clamp01(opts.maxQuality), isWebp: true }
  }

  const maxQ = clamp01(opts.maxQuality)
  const minQ = clamp01(Math.min(opts.minQuality, maxQ))

  const atMaxBytes = await encodeWithSharpWebp(bytes, width, height, maxQ)
  if (atMaxBytes.byteLength <= opts.targetBytes) {
    const blob = makeBlob(atMaxBytes, type)
    const file = opts.returnFile ? maybeMakeFile(atMaxBytes, defaultFileName(opts.fileName), type) : undefined
    return { blob, file, width, height, quality: maxQ, isWebp: true }
  }

  const atMinBytes = await encodeWithSharpWebp(bytes, width, height, minQ)
  if (atMinBytes.byteLength > opts.targetBytes) {
    const blob = makeBlob(atMinBytes, type)
    const file = opts.returnFile ? maybeMakeFile(atMinBytes, defaultFileName(opts.fileName), type) : undefined
    return { blob, file, width, height, quality: minQ, isWebp: true }
  }

  let lo = minQ
  let hi = maxQ
  let bestBytes: Uint8Array = atMinBytes
  let bestQ = minQ

  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2
    const enc = await encodeWithSharpWebp(bytes, width, height, mid)
    if (enc.byteLength <= opts.targetBytes) {
      bestBytes = enc
      bestQ = mid
      lo = mid
    } else {
      hi = mid
    }
  }

  const blob = makeBlob(bestBytes, type)
  const file = opts.returnFile ? maybeMakeFile(bestBytes, defaultFileName(opts.fileName), type) : undefined
  return { blob, file, width, height, quality: bestQ, isWebp: true }
}

