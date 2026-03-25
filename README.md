# imgtowebp

Convert images to **WebP** in both **browsers** (Canvas/OffscreenCanvas) and **Node.js** (via `sharp`), with optional downscaling and an optional “try to hit a target size” quality search.

## What this is for

- **Shrink images for the web**: turn PNG/JPEG/etc into WebP, optionally downscale, and (optionally) try to keep output under a byte budget.
- **Same API across environments**: import `imageToWebp()` from the browser entry or the Node entry.

## Install

```bash
npm i imgtowebp
```

## Quick start

### Browser

```ts
import { imageToWebp } from "imgtowebp"

const res = await imageToWebp(fileOrBlobOrUrl, {
  maxWidth: 2048,
  maxHeight: 2048,
  targetBytes: 300_000,
  maxQuality: 0.82,
  minQuality: 0.45,
  returnFile: true,
})

console.log(res.isWebp, res.width, res.height, res.quality, res.blob.size)
```

- **Input types (browser)**: `Blob | File | string`
  - If `string`, it is fetched as a URL.
- **Output**: always includes `blob`. If `returnFile: true` and the environment has `File`, it also includes `file`.

### Node.js

```ts
import { imageToWebp } from "imgtowebp/node"
import { readFile } from "node:fs/promises"

const bytes = await readFile("input.png")
const res = await imageToWebp(bytes, { targetBytes: 250_000 })

const webpArrayBuffer = await res.blob.arrayBuffer()
console.log(res.isWebp, res.width, res.height, res.quality, webpArrayBuffer.byteLength)
```

- **Input types (node)**: `Buffer | Uint8Array | ArrayBuffer | string`
  - If `string` starts with `http://` or `https://`, it is fetched.
  - Otherwise it is treated as a local file path.
- **Node requirement**: Node.js **18+** (uses global `fetch` / `Blob`).

## API

### `imageToWebp(input, options?)`

#### Options

- **`maxWidth` / `maxHeight`**: hard cap for output dimensions (keeps aspect ratio). Default `2048`.
- **`targetBytes`**: if set, tries to encode to **\(\le\)** this size by lowering quality (binary search within the range).
- **`maxQuality` / `minQuality`**: quality range, from `0` to `1`. Defaults `0.82` / `0.45`.
- **`returnFile`**: if `true`, also returns `file` when `File` exists. Default `false`.
- **`fileName`**: output file name (only used when returning a `File`).
- **`force`**: when WebP encoding isn’t supported in the browser, controls whether the original input can be returned instead of WebP. (In Node, WebP is always produced because `sharp` encodes it.)

#### Result

- **`blob`**: output `Blob` (normally `type === "image/webp"`).
- **`file?`**: only present when `returnFile: true` *and* `File` exists.
- **`width` / `height`**: output dimensions.
- **`quality`**: selected quality in the `0..1` range.
- **`isWebp`**: whether the output is actually WebP.

## Notes and limitations

- **Browser WebP support varies**: the browser build relies on Canvas/OffscreenCanvas WebP encoding support. When encoding isn’t available, the function can return the original input and set `isWebp: false`.
- **Metadata**: EXIF/IPTC metadata is not preserved.
- **Not a perfect “max bytes” guarantee**: `targetBytes` is a best-effort search within the provided quality range.

## Import paths

- **Browser**: `import { imageToWebp } from "imgtowebp"`
- **Node**: `import { imageToWebp } from "imgtowebp/node"`

## Build (contributors)

```bash
npm run build
npm run typecheck
npm test
```

## License

MIT. See `LICENSE`.

