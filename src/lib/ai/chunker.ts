/** Splitting knowledge-base markdown into chunks. Pure: no I/O, so it can be tested and used from scripts. */

export type KbDocument = { title: string; slug: string; sections: { heading: string; body: string }[] };
export type Chunk = { heading: string; content: string; position: number; tokenCount: number };

/** Longest section kept whole. Longer ones are split on paragraph and sentence boundaries. */
export const MAX_CHUNK_TOKENS = 500;
export const TARGET_CHUNK_TOKENS = 400;
export const OVERLAP_TOKENS = 50;

/** A rough but stable estimate (about 4 characters per token). Good enough for sizing, not billing. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

/** Parses `---\ntitle: …\nslug: …\n---` frontmatter and splits the body on `## ` headings. */
export function parseDocument(markdown: string): KbDocument {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(markdown.trim());
  if (!match) throw new Error("Knowledge-base file is missing its frontmatter (---, title, slug, ---).");

  const meta = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => /^(\w+):\s*(.+)$/.exec(line.trim()))
      .filter((entry): entry is RegExpExecArray => entry !== null)
      .map((entry) => [entry[1], entry[2].trim()]),
  );
  if (!meta.title || !meta.slug) throw new Error("Frontmatter needs both `title` and `slug`.");

  const sections: KbDocument["sections"] = [];
  let heading: string | null = null;
  let lines: string[] = [];
  const flush = () => {
    if (heading !== null && lines.join("\n").trim()) sections.push({ heading, body: lines.join("\n").trim() });
  };
  for (const line of match[2].split(/\r?\n/)) {
    const h2 = /^##\s+(.+?)\s*$/.exec(line);
    if (h2) {
      flush();
      heading = h2[1];
      lines = [];
    } else if (heading !== null) {
      lines.push(line);
    }
  }
  flush();

  return { title: meta.title, slug: meta.slug, sections };
}

const sentences = (paragraph: string) => paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g)?.map((s) => s.trim()) ?? [paragraph];

/** One section becomes one chunk. Only sections over MAX_CHUNK_TOKENS are split, with a little overlap. */
export function chunkSection(heading: string, body: string): Omit<Chunk, "position">[] {
  const text = body.trim();
  if (estimateTokens(text) <= MAX_CHUNK_TOKENS) return [{ heading, content: text, tokenCount: estimateTokens(text) }];

  const units = text.split(/\n{2,}/).flatMap((paragraph) =>
    estimateTokens(paragraph) > TARGET_CHUNK_TOKENS ? sentences(paragraph) : [paragraph],
  );

  const chunks: string[] = [];
  let current: string[] = [];
  const size = () => estimateTokens(current.join("\n\n"));
  for (const unit of units) {
    if (current.length > 0 && size() + estimateTokens(unit) > TARGET_CHUNK_TOKENS) {
      chunks.push(current.join("\n\n"));
      // Carry the last sentence(s) of this chunk into the next, so a thought split across two chunks isn't lost.
      const tail: string[] = [];
      const lastSentences = sentences(current.join(" "));
      for (let i = lastSentences.length - 1; i >= 0 && estimateTokens(tail.join(" ")) < OVERLAP_TOKENS; i--) tail.unshift(lastSentences[i]);
      current = tail.length > 0 ? [tail.join(" ")] : [];
    }
    current.push(unit);
  }
  if (current.length > 0 && current.join("\n\n").trim()) chunks.push(current.join("\n\n"));

  return chunks.map((content) => ({ heading, content, tokenCount: estimateTokens(content) }));
}

export function chunkDocument(doc: KbDocument): Chunk[] {
  return doc.sections
    .flatMap((section) => chunkSection(section.heading, section.body))
    .map((chunk, position) => ({ ...chunk, position }));
}

/** The text that is embedded: the chunk with its document and heading, so "Skills" means something. */
export const embeddingText = (docTitle: string, chunk: Pick<Chunk, "heading" | "content">) =>
  `${docTitle} › ${chunk.heading}\n\n${chunk.content}`;
