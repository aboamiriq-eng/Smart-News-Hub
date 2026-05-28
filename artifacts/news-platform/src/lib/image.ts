const PROXY_DOMAINS = [
  "ichef.bbci.co.uk",
  "media.zenfs.com",
  "images.aljazeera.net",
  "arabic.rt.com",
  "www.arabnews.com",
  "english.alarabiya.net",
  "s.yimg.com",
  "l.yimg.com",
  "dims.apnews.com",
  "upload.wikimedia.org",
  "static.reuters.com",
  "cloudfront-us-east-2.images.arcpublishing.com",
];

export function proxyImage(url: string | null | undefined): string | null {
  if (!url) return null;
  // Already a local or Unsplash URL — use directly
  if (url.startsWith("/") || url.includes("unsplash.com")) return url;
  try {
    const { hostname } = new URL(url);
    if (PROXY_DOMAINS.some((d) => hostname === d || hostname.endsWith("." + d))) {
      return `/api/proxy/image?url=${encodeURIComponent(url)}`;
    }
  } catch {
    // invalid URL — return as-is
  }
  return url;
}
