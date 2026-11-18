import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSiteUrl } from "./env";

describe("getSiteUrl", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_URL", "");
    vi.stubEnv("VERCEL_URL", "");
    vi.stubEnv("VERCEL_ENV", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses localhost only outside production when no public URL is configured", () => {
    vi.stubEnv("NODE_ENV", "development");

    expect(getSiteUrl()).toBe("http://localhost:3000");
  });

  it("requires a configured public URL in production", () => {
    vi.stubEnv("NODE_ENV", "production");

    expect(() => getSiteUrl()).toThrow("NEXT_PUBLIC_SITE_URL est requise");
  });

  it("rejects insecure production URLs", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://cfc-housing-portal.vercel.app");

    expect(() => getSiteUrl()).toThrow("HTTPS valide en production");
  });

  it("uses the current Vercel deployment for preview links", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "cfc-preview-123.vercel.app");

    expect(getSiteUrl()).toBe("https://cfc-preview-123.vercel.app");
  });

  it("normalizes the configured production site to its origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://portal.example.cm/path/");

    expect(getSiteUrl()).toBe("https://portal.example.cm");
  });
});
