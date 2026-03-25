export type ImageToWebpInput = Blob | File | string

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
   * If omitted and input is a File, the name is derived from it.
   */
  fileName?: string

  /**
   * Return a File instead of a Blob.
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

function toWebpName(name: string) {
  const base = name.replace(/\.[^/.]+$/, "")
  return `${base || "image"}.webp`
}

function getInputName(input: ImageToWebpInput) {
  if (typeof input === "string") return "image.webp"
  if (input instanceof File && input.name) return toWebpName(input.name)
  return "image.webp"
}

async function inputToBlob(input: ImageToWebpInput): Promise<Blob> {
  if (typeof input === "string") {
    const res = await fetch(input)
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`)
    return await res.blob()
  }
  return input
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

async function decodeImage(blob: Blob): Promise<{ bitmap: ImageBitmap; width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" as any })
    return { bitmap, width: bitmap.width, height: bitmap.height }
  }

  const url = URL.createObjectURL(blob)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("Failed to decode image"))
      el.src = url
    })

    const canvas = document.createElement("canvas")
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas 2D context not available")
    ctx.drawImage(img, 0, 0)

    const dataUrl = canvas.toDataURL("image/png")
    const pngBlob = await (await fetch(dataUrl)).blob()
    const bitmap = await createImageBitmap(pngBlob)
    return { bitmap, width: bitmap.width, height: bitmap.height }
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function encodeWebpFromBitmap(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number
): Promise<Blob | null> {
  const q = clamp01(quality)

  const hasOffscreen = typeof OffscreenCanvas !== "undefined"
  if (hasOffscreen) {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(bitmap, 0, 0, width, height)
    try {
      return await canvas.convertToBlob({ type: "image/webp", quality: q })
    } catch {
      return null
    }
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return null
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/webp", q)
  })
  return blob
}

/**
 * Convert an image (png/jpg/etc) to WebP and shrink size while keeping similar quality.
 *
 * - Downscales to `maxWidth`/`maxHeight` (keeps aspect ratio).
 * - Encodes as WebP with a quality search to try meeting `targetBytes` (if provided).
 */
export async function imageToWebp(
  input: ImageToWebpInput,
  options: ImageToWebpOptions = {}
): Promise<ImageToWebpResult> {
  const opts = { ...DEFAULTS, ...options }
  const blob = await inputToBlob(input)

  const { bitmap, width: srcW, height: srcH } = await decodeImage(blob)
  try {
    const { width, height } = computeTargetSize(srcW, srcH, opts.maxWidth, opts.maxHeight)

    if (!opts.targetBytes || opts.targetBytes <= 0) {
      const out = await encodeWebpFromBitmap(bitmap, width, height, opts.maxQuality)
      if (!out) {
        if (!opts.force) return { blob, width: srcW, height: srcH, quality: 1, isWebp: false }
        return { blob, width: srcW, height: srcH, quality: 1, isWebp: false }
      }

      const fileName = opts.fileName ?? getInputName(input)
      const file = opts.returnFile ? new File([out], fileName, { type: out.type }) : undefined
      return { blob: out, file, width, height, quality: opts.maxQuality, isWebp: true }
    }

    const maxQ = clamp01(opts.maxQuality)
    const minQ = clamp01(Math.min(opts.minQuality, maxQ))

    const atMax = await encodeWebpFromBitmap(bitmap, width, height, maxQ)
    if (!atMax) {
      if (!opts.force) return { blob, width: srcW, height: srcH, quality: 1, isWebp: false }
      return { blob, width: srcW, height: srcH, quality: 1, isWebp: false }
    }
    if (atMax.size <= opts.targetBytes) {
      const fileName = opts.fileName ?? getInputName(input)
      const file = opts.returnFile ? new File([atMax], fileName, { type: atMax.type }) : undefined
      return { blob: atMax, file, width, height, quality: maxQ, isWebp: true }
    }

    const atMin = await encodeWebpFromBitmap(bitmap, width, height, minQ)
    if (!atMin) {
      const fileName = opts.fileName ?? getInputName(input)
      const file = opts.returnFile ? new File([atMax], fileName, { type: atMax.type }) : undefined
      return { blob: atMax, file, width, height, quality: maxQ, isWebp: true }
    }
    if (atMin.size > opts.targetBytes) {
      const fileName = opts.fileName ?? getInputName(input)
      const file = opts.returnFile ? new File([atMin], fileName, { type: atMin.type }) : undefined
      return { blob: atMin, file, width, height, quality: minQ, isWebp: true }
    }

    let lo = minQ
    let hi = maxQ
    let bestBlob: Blob = atMin
    let bestQ = minQ

    for (let i = 0; i < 7; i++) {
      const mid = (lo + hi) / 2
      const enc = await encodeWebpFromBitmap(bitmap, width, height, mid)
      if (!enc) break

      if (enc.size <= opts.targetBytes) {
        bestBlob = enc
        bestQ = mid
        lo = mid
      } else {
        hi = mid
      }
    }

    const fileName = opts.fileName ?? getInputName(input)
    const file = opts.returnFile ? new File([bestBlob], fileName, { type: bestBlob.type }) : undefined
    return { blob: bestBlob, file, width, height, quality: bestQ, isWebp: true }
  } finally {
    bitmap.close()
  }
}

