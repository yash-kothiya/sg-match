import type { Level, Mode, Slot } from "../_helpers";

export type SeedUser = {
  n: number;
  name: string;
  university: string;
  bio: string;
  level: Level;
  mode: Mode;
  location: string | null;
  availability: Slot[];
  interests: string[];
  skills: string[];
};

// Fictional people (and fictional schools). They own the seeded requests and groups and
// fill the seeded groups' member lists. They cannot sign in: there is no Firebase account.
export const SEED_USERS: SeedUser[] = [
  { n: 1, name: "Priya Nair", university: "Northbridge University", bio: "Final-year CS student preparing for software engineering interviews.", level: "intermediate", mode: "online", location: "Singapore", availability: ["weekday_evening", "weekend_morning"], interests: ["Algorithms", "Interview prep"], skills: ["Algorithms", "Python", "Data structures"] },
  { n: 2, name: "Marcus Lee", university: "Lakeside Institute of Technology", bio: "Switching into data science from a business degree.", level: "beginner", mode: "hybrid", location: "Singapore", availability: ["weekend_morning", "weekend_afternoon"], interests: ["Machine learning", "Data science"], skills: ["Python", "Statistics"] },
  { n: 3, name: "Aisha Rahman", university: "Westfield College", bio: "Building side projects and looking for people to ship with.", level: "intermediate", mode: "hybrid", location: "Bangalore", availability: ["weekday_evening", "weekend_morning"], interests: ["Web development", "Startups"], skills: ["React", "TypeScript", "Node.js"] },
  { n: 4, name: "Daniel Okafor", university: "Westfield College", bio: "Mechanical engineering, second year. Calculus is my weak spot.", level: "beginner", mode: "in_person", location: "London", availability: ["weekday_afternoon"], interests: ["Mathematics", "Physics"], skills: ["Physics"] },
  { n: 5, name: "Sofia Alvarez", university: "Northbridge University", bio: "Master's student writing a thesis with a lot of survey data.", level: "intermediate", mode: "online", location: null, availability: ["weekday_morning", "weekday_evening"], interests: ["Statistics", "Research"], skills: ["Statistics", "Data analysis", "Probability"] },
  { n: 6, name: "Kenji Tanaka", university: "Lakeside Institute of Technology", bio: "Systems programming enthusiast. Likes kernels and compilers.", level: "advanced", mode: "in_person", location: "Toronto", availability: ["weekday_evening"], interests: ["Systems programming", "Operating systems"], skills: ["C", "Operating systems", "Computer networks"] },
  { n: 7, name: "Hannah Weiss", university: "Northbridge University", bio: "Reading deep learning papers and wants someone to argue with.", level: "advanced", mode: "online", location: null, availability: ["weekday_evening", "weekend_evening"], interests: ["Machine learning", "Research"], skills: ["Deep learning", "Machine learning", "Python"] },
  { n: 8, name: "Omar Haddad", university: "Westfield College", bio: "Backend developer going deeper on databases.", level: "intermediate", mode: "hybrid", location: "Singapore", availability: ["weekday_evening"], interests: ["Databases", "Backend development"], skills: ["SQL", "Databases", "Node.js"] },
  { n: 9, name: "Lena Fischer", university: "Lakeside Institute of Technology", bio: "Designer learning to code the front end.", level: "beginner", mode: "online", location: null, availability: ["weekend_morning"], interests: ["Web development", "Design"], skills: ["HTML & CSS"] },
  { n: 10, name: "Rahul Mehta", university: "Westfield College", bio: "Pre-med. Organic chemistry exam in six weeks.", level: "intermediate", mode: "in_person", location: "Bangalore", availability: ["weekend_afternoon"], interests: ["Chemistry", "Exam prep"], skills: ["Chemistry", "Biology"] },
  { n: 11, name: "Chloe Martin", university: "Westfield College", bio: "Postgraduate who wants to write and present with more confidence.", level: "beginner", mode: "hybrid", location: "London", availability: ["weekday_afternoon"], interests: ["Writing", "Presentations"], skills: ["Academic writing"] },
  { n: 12, name: "Tomas Novak", university: "Northbridge University", bio: "Discrete maths and proofs for a CS theory course.", level: "intermediate", mode: "online", location: null, availability: ["weekday_evening", "weekend_afternoon"], interests: ["Mathematics", "Proofs", "Algorithms"], skills: ["Discrete mathematics", "Algorithms", "Probability"] },
];
