import type { Level, Mode, Slot } from "../_helpers";

export type SeedRequest = {
  n: number;
  /** Seed user number who owns the request. */
  user: number;
  title: string;
  subject: string;
  description: string;
  level: Level;
  mode: Mode;
  location: string | null;
  availability: Slot[];
  interests: string[];
  skills: string[];
};

/*
 * Dataset A: 12 study requests, one per seeded user.
 *
 * GOLDEN CASE (R1, Priya Nair): "Algorithms Sprint" (group 01) must rank first.
 *  Priya wants: intermediate, online, weekday evenings + weekend mornings,
 *  skills Algorithms / Data structures / Python, interests Algorithms / Interview prep.
 *  - 01 Algorithms Sprint matches every signal.
 *  - 02 LeetCode Weekend Warriors shares her interests but is advanced, covers only 2 of her
 *    3 skills (Java instead of Python) and meets only on weekends.
 *  - 03 Singapore Algo Study Circle covers all 3 skills and her evenings but is in person, and
 *    she studies online.
 */
export const SEED_REQUESTS: SeedRequest[] = [
  { n: 1, user: 1, title: "Interview prep: algorithms and data structures", subject: "Algorithms", description: "Looking for a steady group to practise interview-style problems and run mock interviews. I'm comfortable with Python.", level: "intermediate", mode: "online", location: "Singapore", availability: ["weekday_evening", "weekend_morning"], interests: ["Algorithms", "Interview prep"], skills: ["Algorithms", "Data structures", "Python"] },
  { n: 2, user: 2, title: "Learn machine learning from scratch", subject: "Machine learning", description: "Coming from a business background. Want a patient group to learn ML fundamentals with weekend sessions.", level: "beginner", mode: "hybrid", location: "Singapore", availability: ["weekend_morning", "weekend_afternoon"], interests: ["Machine learning", "Data science"], skills: ["Machine learning", "Python", "Statistics"] },
  { n: 3, user: 3, title: "Build and ship a full-stack app", subject: "Web development", description: "Want teammates to build a real product with Next.js and Postgres over a couple of months.", level: "intermediate", mode: "hybrid", location: "Bangalore", availability: ["weekday_evening", "weekend_morning"], interests: ["Web development", "Startups"], skills: ["React", "Next.js", "TypeScript"] },
  { n: 4, user: 4, title: "Calculus for engineering", subject: "Calculus", description: "Need help getting through first-year calculus. Prefer meeting in person on weekday afternoons.", level: "beginner", mode: "in_person", location: "London", availability: ["weekday_afternoon"], interests: ["Mathematics", "Physics"], skills: ["Calculus", "Physics"] },
  { n: 5, user: 5, title: "Statistics for my thesis", subject: "Statistics", description: "Analysing survey data and want to sanity-check methods with others who know their statistics.", level: "intermediate", mode: "online", location: null, availability: ["weekday_morning", "weekday_evening"], interests: ["Statistics", "Research"], skills: ["Statistics", "Data analysis", "Probability"] },
  { n: 6, user: 6, title: "Systems programming and operating systems", subject: "Operating systems", description: "Looking for advanced peers to work through kernel and systems material in person.", level: "advanced", mode: "in_person", location: "Toronto", availability: ["weekday_evening"], interests: ["Systems programming", "Operating systems"], skills: ["Operating systems", "C", "Computer networks"] },
  { n: 7, user: 7, title: "Deep learning paper reading", subject: "Deep learning", description: "Want a small group to read and discuss one paper a week.", level: "advanced", mode: "online", location: null, availability: ["weekday_evening", "weekend_evening"], interests: ["Machine learning", "Research"], skills: ["Deep learning", "Machine learning", "Python"] },
  { n: 8, user: 8, title: "Database design and SQL", subject: "Databases", description: "Going deeper on schema design and query performance, ideally with a hybrid group.", level: "intermediate", mode: "hybrid", location: "Singapore", availability: ["weekday_evening"], interests: ["Databases", "Backend development"], skills: ["SQL", "Databases"] },
  { n: 9, user: 9, title: "Front-end basics", subject: "Web development", description: "Designer learning to code. Looking for beginners to build small pages with on weekends.", level: "beginner", mode: "online", location: null, availability: ["weekend_morning"], interests: ["Web development", "Design"], skills: ["HTML & CSS", "JavaScript", "React"] },
  { n: 10, user: 10, title: "Organic chemistry and biology exam prep", subject: "Chemistry", description: "Exam in six weeks. Want an in-person weekend group for past papers.", level: "intermediate", mode: "in_person", location: "Bangalore", availability: ["weekend_afternoon"], interests: ["Chemistry", "Exam prep"], skills: ["Chemistry", "Biology"] },
  { n: 11, user: 11, title: "Academic writing and presentations", subject: "Academic writing", description: "Looking for peers to review drafts and rehearse talks with.", level: "beginner", mode: "hybrid", location: "London", availability: ["weekday_afternoon"], interests: ["Writing", "Presentations"], skills: ["Academic writing", "Public speaking"] },
  { n: 12, user: 12, title: "Discrete maths and proofs for CS", subject: "Discrete mathematics", description: "Need regular proof practice for a theory course. Online evenings or weekend afternoons.", level: "intermediate", mode: "online", location: null, availability: ["weekday_evening", "weekend_afternoon"], interests: ["Mathematics", "Proofs", "Algorithms"], skills: ["Discrete mathematics", "Algorithms", "Probability"] },
];
