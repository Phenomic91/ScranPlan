const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  deg: '°',
  frac12: '½',
  frac14: '¼',
  frac34: '¾',
  pound: '£',
  eacute: 'é',
};

/** Decodes the HTML entities recipe sites use. Unknown named entities are left as written. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (entity, code: string) => {
    if (code[0] === '#') {
      const point =
        code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : Number(code.slice(1));
      return Number.isFinite(point) && point > 0 ? String.fromCodePoint(point) : entity;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

/** Turns an HTML fragment into plain text, one line per block element. */
export function htmlToText(html: string): string {
  const text = html
    .replace(/<(script|style|noscript|svg|template)\b[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/section|\/article)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  return decodeEntities(text)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/** Parses every `<script type="application/ld+json">` block, skipping any that are broken. */
export function readJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const pattern =
    /<script\b[^>]*type\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi;
  for (const [, body] of html.matchAll(pattern)) {
    try {
      blocks.push(JSON.parse(body?.trim() ?? ''));
    } catch {
      // Some sites ship invalid JSON-LD next to a good block; the good one is enough.
    }
  }
  return blocks;
}

/** Reads `<meta property="og:site_name" content="…">` and similar tags. */
export function readMetaContent(html: string, property: string): string | null {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const name = /\b(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (name?.toLowerCase() !== property.toLowerCase()) continue;
    const content = /\bcontent\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    if (content) return decodeEntities(content).trim();
  }
  return null;
}

/**
 * The readable text of a page, for AI to read when the page has no recipe data.
 * Uses the main article when the page marks one, to leave out menus and footers.
 */
export function readPageText(html: string, maxLength: number): string {
  const title = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1];
  const main =
    /<article\b[\s\S]*<\/article>/i.exec(html)?.[0] ??
    /<main\b[\s\S]*<\/main>/i.exec(html)?.[0] ??
    /<body\b[\s\S]*<\/body>/i.exec(html)?.[0] ??
    html;
  const text = [title ? htmlToText(title) : '', htmlToText(main)].filter(Boolean).join('\n');
  return text.slice(0, maxLength);
}
