import { isHealthBill } from "./constants";

/**
 * Parse NCGA RSS XML into structured bill objects.
 * Uses regex-based parsing to avoid heavy XML dependencies.
 */
export function parseRSSBills(xmlText) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, "title");
    const link = extractTag(itemXml, "link");
    const description = extractTag(itemXml, "description");
    const pubDate = extractTag(itemXml, "pubDate");

    const billMatch = title.match(/^(H[BRJC]*|S[BRJC]*)\s*(\d+)/i);
    const chamber = title.startsWith("H") ? "House" : title.startsWith("S") ? "Senate" : "Unknown";
    const billNumber = billMatch ? `${billMatch[1]} ${billMatch[2]}` : title.split(" - ")[0]?.trim();
    const billTitle = title.split(" - ").slice(1).join(" - ").trim() || title;

    items.push({
      id: link || `${billNumber}-${pubDate}`,
      billNumber,
      title: billTitle,
      description: decodeEntities(description),
      link,
      pubDate,
      chamber,
      isHealth: isHealthBill(title, description),
    });
  }

  return items;
}

function extractTag(xml, tag) {
  // Handle CDATA
  const cdataRegex = new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`);
  const cdataMatch = xml.match(cdataRegex);
  if (cdataMatch) return cdataMatch[1].trim();

  const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`);
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function decodeEntities(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
