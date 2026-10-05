/**
 * Retrieval evaluation. Embeds every question in src/kb/eval.json, finds the closest chunk, and reports
 * how well answerable questions hit the right section and how well other questions fall below the
 * threshold. Use the recommended threshold to set RAG_MIN_SIMILARITY in src/config/constants.ts.
 * Run with `bun run ai:eval`. Needs the knowledge base seeded (`bun run db:seed kb`). Reads only.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { RAG_MIN_SIMILARITY } from "@/config/constants";
import { createSeedDb } from "@/db/seeder/_client";
import { embedQuery, GeminiError } from "@/lib/ai/gemini";
import { scriptGeminiConfig } from "@/lib/ai/script-config";

type Case = { q: string; kind: "answerable" | "unanswerable" | "adversarial"; expect?: string };
const PAUSE_MS = 1200; // free-tier friendly

async function main() {
  const config = scriptGeminiConfig();
  const cases: Case[] = JSON.parse(readFileSync(path.resolve(process.cwd(), "src/kb/eval.json"), "utf8"));
  const { db, close } = createSeedDb();

  try {
    const rows: { c: Case; heading: string; similarity: number }[] = [];
    for (const c of cases) {
      const literal = `[${(await embedQuery(config, c.q)).join(",")}]`;
      const [best] = await db.execute<{ heading: string; similarity: number }>(sql`
        select heading, 1 - (embedding <=> ${literal}::vector) as similarity
        from kb_chunks where embedding_model = ${config.embeddingModel}
        order by embedding <=> ${literal}::vector limit 1`);
      if (!best) throw new Error("No chunks for this embedding model. Run `bun run db:seed kb` first.");
      rows.push({ c, heading: best.heading, similarity: Number(best.similarity) });
      await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
    }

    for (const kind of ["answerable", "unanswerable", "adversarial"] as const) {
      console.log(`\n${kind.toUpperCase()}`);
      for (const { c, heading, similarity } of rows.filter((r) => r.c.kind === kind)) {
        const passes = similarity >= RAG_MIN_SIMILARITY;
        const hit = c.expect ? (heading === c.expect ? "hit " : "MISS") : "    ";
        console.log(`  ${similarity.toFixed(3)} ${passes ? "answer " : "refuse "} ${hit} ${c.q}${c.expect && heading !== c.expect ? `  -> got "${heading}"` : ""}`);
      }
    }

    const answerable = rows.filter((r) => r.c.kind === "answerable");
    const others = rows.filter((r) => r.c.kind !== "answerable");
    const lowestAnswerable = Math.min(...answerable.map((r) => r.similarity));
    const highestOther = Math.max(...others.map((r) => r.similarity));
    const hits = answerable.filter((r) => r.heading === r.c.expect).length;
    const answered = answerable.filter((r) => r.similarity >= RAG_MIN_SIMILARITY).length;
    const refused = others.filter((r) => r.similarity < RAG_MIN_SIMILARITY).length;

    console.log(`\nWith RAG_MIN_SIMILARITY = ${RAG_MIN_SIMILARITY}:`);
    console.log(`  answerable questions that retrieve the right section: ${hits}/${answerable.length}`);
    console.log(`  answerable questions that would be answered:          ${answered}/${answerable.length}`);
    console.log(`  other questions that would be refused (no model call): ${refused}/${others.length}`);
    console.log(`\nLowest answerable similarity: ${lowestAnswerable.toFixed(3)}   Highest unanswerable/adversarial: ${highestOther.toFixed(3)}`);
    if (lowestAnswerable > highestOther) {
      console.log(`Clean gap. A threshold of about ${((lowestAnswerable + highestOther) / 2).toFixed(2)} separates them.`);
    } else {
      console.log("The ranges overlap. Pick the value that favours refusing; a wrong refusal is safer than a wrong answer.");
    }
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error("✗", error instanceof GeminiError ? `${error.code}: ${error.message}` : error instanceof Error ? error.message : error);
  process.exit(1);
});
