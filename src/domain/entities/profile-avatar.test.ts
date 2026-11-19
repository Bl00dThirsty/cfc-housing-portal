import { describe, expect, it } from "vitest";

import { validateProfileAvatarBytes } from "./profile-avatar";

function png(width: number, height: number): Uint8Array {
  const bytes = new Uint8Array(24);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12);
  bytes[16] = (width >>> 24) & 0xff;
  bytes[17] = (width >>> 16) & 0xff;
  bytes[18] = (width >>> 8) & 0xff;
  bytes[19] = width & 0xff;
  bytes[20] = (height >>> 24) & 0xff;
  bytes[21] = (height >>> 16) & 0xff;
  bytes[22] = (height >>> 8) & 0xff;
  bytes[23] = height & 0xff;
  return bytes;
}

describe("validateProfileAvatarBytes", () => {
  it("accepts a correctly declared PNG within the size and dimension limits", () => {
    expect(validateProfileAvatarBytes("image/png", png(640, 480))).toMatchObject({
      ok: true,
      format: "png",
      extension: "png",
      width: 640,
      height: 480,
    });
  });

  it("rejects a MIME mismatch and a malformed image", () => {
    expect(validateProfileAvatarBytes("image/jpeg", png(640, 480))).toMatchObject({ ok: false });
    expect(validateProfileAvatarBytes("image/png", new Uint8Array([0x89, 0x50]))).toMatchObject({ ok: false });
  });

  it("rejects an image above the pixel limit", () => {
    expect(validateProfileAvatarBytes("image/png", png(2049, 640))).toMatchObject({ ok: false });
  });
});
