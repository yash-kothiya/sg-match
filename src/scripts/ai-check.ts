/**
 * Step 1 of the AI build: proves the Gemini key, model ids, embedding dimension and structured output work.
 * Run with `bun run ai:check`. Makes 3 small API calls and writes nothing.
 */
import { buildUserTurn, parseModelOutput, RESPONSE_JSON_SCHEMA, SYSTEM_INSTRUCTION } from "@/lib/ai/prompt";
import { embedDocuments, embedQuery, generateJson, GeminiError } from "@/lib/ai/gemini";
import { scriptGeminiConfig } from "@/lib/ai/script-config";

async function main() {
  const config = scriptGeminiConfig();
  console.log(`chat model:      ${config.chatModel}\nembedding model: ${config.embeddingModel}\ndimensions:      ${config.dimensions}\n`);

  const [doc] = await embedDocuments(config, [{ title: "Study techniques", text: "Active recall means testing yourself instead of rereading." }]);
  console.log(`✓ document embedding: ${doc.length} dimensions, norm ${Math.hypot(...doc).toFixed(3)}`);

  const query = await embedQuery(config, "How can I remember things better?");
  const cosine = doc.reduce((sum, x, i) => sum + x * query[i], 0);
  console.log(`✓ query embedding:    ${query.length} dimensions, similarity to the passage ${cosine.toFixed(3)} (related text should be clearly above 0.5)`);

  const unrelated = await embedQuery(config, "What is the capital of Peru?");
  console.log(`  unrelated question similarity: ${doc.reduce((s, x, i) => s + x * unrelated[i], 0).toFixed(3)} (should be clearly lower)`);

  const raw = await generateJson(
    config,
    {
      system: SYSTEM_INSTRUCTION,
      user: buildUserTurn("What is active recall?", [
        { documentTitle: "Study techniques", heading: "Active recall", content: "Active recall means testing yourself instead of rereading. It makes memories stick." },
      ]),
      schema: RESPONSE_JSON_SCHEMA,
      maxOutputTokens: 700,
    },
    20_000,
  );
  const parsed = parseModelOutput(raw, 1);
  console.log(`✓ structured answer:  grounded=${parsed.grounded} sources=[${parsed.sources}]\n  "${parsed.answer}"`);
  if (!parsed.grounded || parsed.sources.length === 0) console.log("  ⚠ expected a grounded answer citing source 1");
  console.log("\nAll checks passed. Next: bun run db:migrate, then bun run db:seed kb");
}

main().catch((error) => {
  if (error instanceof GeminiError) console.error(`✗ ${error.code}: ${error.message}`);
  else console.error("✗", error instanceof Error ? error.message : error);
  process.exit(1);
});
