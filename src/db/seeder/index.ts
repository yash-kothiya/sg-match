import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: bun run db:seed <filename>  (e.g. bun run db:seed skills)");
    process.exit(1);
  }

  const fileName = arg.endsWith(".ts") ? arg : `${arg}.ts`;
  const seederPath = path.resolve(
    process.cwd(),
    "src",
    "db",
    "seeder",
    fileName
  );

  if (!fs.existsSync(seederPath)) {
    console.error(`Seeder file not found: ${seederPath}`);
    process.exit(1);
  }

  try {
    const moduleUrl = pathToFileURL(seederPath).href;
    const mod: { seed?: () => Promise<void>; default?: () => Promise<void> } = await import(moduleUrl);

    if (typeof mod.seed === "function") {
      await mod.seed();
    } else if (typeof mod.default === "function") {
      await mod.default();
    } else {
      console.warn("No seed function exported. The module may self-execute.");
    }

    console.log("Seeding finished.");
    process.exit(0);
  } catch (err) {
    console.error("Failed to run seeder:", err);
    process.exit(1);
  }
}

main();
