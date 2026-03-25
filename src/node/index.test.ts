import { describe, expect, it } from "vitest"
import sharp from "sharp"
import { imageToWebp } from "./index"

async function makePng(width: number, height: number) {
  return await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 40, g: 100, b: 200, alpha: 1 },
    },
  })
    .png()
    .toBuffer()
}

describe("imageToWebp (node)", () => {
  it("downscales to maxWidth/maxHeight", async () => {
    const input = await makePng(1200, 800)
    const res = await imageToWebp(input, { maxWidth: 300, maxHeight: 300 })
    expect(res.isWebp).toBe(true)
    expect(res.width).toBe(300)
    expect(res.height).toBe(200)
    expect(res.blob.type).toBe("image/webp")
  })

  it("tries to meet targetBytes by reducing quality", async () => {
    const input = await makePng(1024, 1024)
    const targetBytes = 20_000
    const res = await imageToWebp(input, {
      targetBytes,
      maxQuality: 0.95,
      minQuality: 0.2,
      maxWidth: 1024,
      maxHeight: 1024,
    })
    expect(res.isWebp).toBe(true)
    expect(res.blob.size).toBeLessThanOrEqual(targetBytes)
    expect(res.quality).toBeGreaterThanOrEqual(0.2)
    expect(res.quality).toBeLessThanOrEqual(0.95)
  })
})

