export const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;
export const PROFILE_AVATAR_MAX_DIMENSION = 2048;

export type ProfileAvatarFormat = "jpeg" | "png" | "webp";

export type ProfileAvatarValidation =
  | { ok: true; format: ProfileAvatarFormat; extension: string; width: number; height: number }
  | { ok: false; error: string };

function u24le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function readJpegDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      continue;
    }
    if (offset + 2 > bytes.length) return null;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) return null;
    const isStartOfFrame =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isStartOfFrame) {
      return {
        height: (bytes[offset + 3] << 8) | bytes[offset + 4],
        width: (bytes[offset + 5] << 8) | bytes[offset + 6],
      };
    }
    offset += length;
  }
  return null;
}

function readWebpDimensions(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 30) return null;
  const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);

  if (chunk === "VP8X") {
    return { width: u24le(bytes, 24) + 1, height: u24le(bytes, 27) + 1 };
  }

  if (chunk === "VP8 ") {
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) return null;
    return {
      width: ((bytes[27] << 8) | bytes[26]) & 0x3fff,
      height: ((bytes[29] << 8) | bytes[28]) & 0x3fff,
    };
  }

  if (chunk === "VP8L" && bytes[20] === 0x2f) {
    const width = 1 + bytes[21] + ((bytes[22] & 0x3f) << 8);
    const height = 1 + (bytes[22] >> 6) + (bytes[23] << 2) + ((bytes[24] & 0x0f) << 10);
    return { width, height };
  }

  return null;
}

/** Verify file signature and dimensions instead of trusting the browser MIME claim. */
export function validateProfileAvatarBytes(
  declaredType: string,
  bytes: Uint8Array,
): ProfileAvatarValidation {
  if (bytes.length === 0 || bytes.length > PROFILE_AVATAR_MAX_BYTES) {
    return { ok: false, error: "La photo doit peser 5 Mo maximum." };
  }

  let format: ProfileAvatarFormat | null = null;
  let dimensions: { width: number; height: number } | null = null;

  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    format = "png";
    dimensions = {
      width: (bytes[16] * 0x1000000) + (bytes[17] << 16) + (bytes[18] << 8) + bytes[19],
      height: (bytes[20] * 0x1000000) + (bytes[21] << 16) + (bytes[22] << 8) + bytes[23],
    };
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    format = "jpeg";
    dimensions = readJpegDimensions(bytes);
  } else if (
    bytes.length >= 30 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  ) {
    format = "webp";
    dimensions = readWebpDimensions(bytes);
  }

  const declaredFormat = declaredType === "image/jpeg" ? "jpeg" : declaredType === "image/png" ? "png" : declaredType === "image/webp" ? "webp" : null;
  if (!format || format !== declaredFormat || !dimensions) {
    return { ok: false, error: "Utilisez une image JPEG, PNG ou WebP valide." };
  }

  if (
    dimensions.width < 1 ||
    dimensions.height < 1 ||
    dimensions.width > PROFILE_AVATAR_MAX_DIMENSION ||
    dimensions.height > PROFILE_AVATAR_MAX_DIMENSION
  ) {
    return { ok: false, error: "La photo ne doit pas dépasser 2048 × 2048 pixels." };
  }

  return {
    ok: true,
    format,
    extension: format === "jpeg" ? "jpg" : format,
    width: dimensions.width,
    height: dimensions.height,
  };
}
