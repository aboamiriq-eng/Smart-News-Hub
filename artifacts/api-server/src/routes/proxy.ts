import { Router } from "express";

const router = Router();

const ALLOWED_DOMAINS = [
  "ichef.bbci.co.uk",
  "media.zenfs.com",
  "feeds.bbci.co.uk",
  "images.unsplash.com",
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

router.get("/proxy/image", async (req, res) => {
  const url = req.query.url as string;
  if (!url) return res.status(400).send("Missing url");

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).send("Invalid url");
  }

  const allowed = ALLOWED_DOMAINS.some(
    (d) => parsed.hostname === d || parsed.hostname.endsWith("." + d)
  );
  if (!allowed) return res.status(403).send("Domain not allowed");

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AlNaba-Bot/1.0)",
        Referer: parsed.origin,
        Accept: "image/*,*/*",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!upstream.ok) return res.status(upstream.status).send("Upstream error");

    const ct = upstream.headers.get("content-type") || "image/jpeg";
    res.setHeader("Content-Type", ct);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.setHeader("Access-Control-Allow-Origin", "*");

    const buf = await upstream.arrayBuffer();
    res.send(Buffer.from(buf));
  } catch (err: any) {
    res.status(502).send("Proxy error: " + err.message);
  }
});

export default router;
