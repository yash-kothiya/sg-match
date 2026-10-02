import { seed as seedGroups } from "./groups";
import { seed as seedRequests } from "./requests";
import { seed as seedSkills } from "./skills";
import { seed as seedUsers } from "./users";

/** Everything, in dependency order: `bun run db:seed all`. */
export async function seed() {
  await seedSkills();
  await seedUsers();
  await seedGroups();
  await seedRequests();
}
