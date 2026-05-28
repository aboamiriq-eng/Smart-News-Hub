import { XMLParser } from "fast-xml-parser";

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  imageUrl: string | null;
  guid: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  cdataPropName: "__cdata",
  isArray: (name) => name === "item" || name === "entry",
});

function extractImage(item: any): string | null {
  // media:content (array or single)
  const mc = item["media:content"];
  if (Array.isArray(mc)) {
    const found = mc.find((m: any) => m["@_url"]);
    if (found) return found["@_url"];
  } else if (mc?.["@_url"]) return mc["@_url"];

  // media:thumbnail
  const mt = item["media:thumbnail"];
  if (mt?.["@_url"]) return mt["@_url"];

  // enclosure with image type
  const enc = item.enclosure;
  if (enc?.["@_url"] && (enc["@_type"] || "").startsWith("image")) return enc["@_url"];
  if (enc?.["@_url"]) return enc["@_url"];

  // img tag inside description or content:encoded
  const raw =
    item["content:encoded"]?.__cdata ||
    item["content:encoded"] ||
    item.description?.__cdata ||
    item.description ||
    "";
  const imgMatch = raw.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  return null;
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "AlNaba-NewsBot/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function cleanHtml(str: string): string {
  return (str || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#\d+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function fetchRssFeed(feedUrl: string): Promise<RssItem[]> {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "AlNaba-NewsBot/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status} ${feedUrl}`);
  const xml = await res.text();
  const parsed = parser.parse(xml);

  const channel = parsed?.rss?.channel || parsed?.feed;
  if (!channel) throw new Error("Invalid RSS/Atom feed");

  const rawItems: any[] = channel.item || channel.entry || [];

  const items: RssItem[] = rawItems.slice(0, 20).map((item) => {
    const link = item.link?.["@_href"] || item.link || item.guid || "";
    return {
      title: cleanHtml(item.title?.__cdata || item.title || ""),
      link,
      description: cleanHtml(
        item.description?.__cdata ||
        item.description ||
        item.summary?.__cdata ||
        item.summary ||
        ""
      ),
      pubDate: item.pubDate || item.updated || item.published || null,
      imageUrl: extractImage(item),
      guid: item.guid?.__cdata || item.guid?.["#text"] || item.guid || item.id || link || "",
    };
  });

  // For items without images, try fetching og:image from the article page (max 5 concurrent)
  const noImage = items.filter((i) => !i.imageUrl && i.link);
  if (noImage.length > 0) {
    const batch = noImage.slice(0, 8); // limit to 8 OG fetches
    const results = await Promise.allSettled(
      batch.map((item) => fetchOgImage(item.link))
    );
    results.forEach((result, idx) => {
      if (result.status === "fulfilled" && result.value) {
        batch[idx].imageUrl = result.value;
      }
    });
  }

  return items;
}
