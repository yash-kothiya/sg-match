import type { Level, Mode, Slot } from "../_helpers";

export type SeedGroup = {
  n: number;
  name: string;
  subject: string;
  description: string;
  level: Level;
  mode: Mode;
  location: string | null;
  availability: Slot[];
  interests: string[];
  skills: string[];
  maxMembers: number;
  /** Seed user numbers. The owner is also an accepted member; `members` are the others. */
  owner: number;
  members: number[];
};

/*
 * 28 groups across algorithms, ML and data, web, maths and other subjects.
 * Deliberately included for the matching demo:
 *  - the golden-case trio (01, 02, 03) around Priya's request (see requests.ts, R1);
 *  - three FULL groups (04, 12, 19: members + owner = maxMembers) that must be excluded;
 *  - a spread of modes, levels and locations, so no single signal decides every ranking.
 */
export const SEED_GROUPS: SeedGroup[] = [
  // --- Algorithms and core CS ---
  { n: 1, name: "Algorithms Sprint", subject: "Algorithms", description: "Evening problem-solving sessions on arrays, trees and graphs, with a weekly mock interview. Remote, friendly pace.", level: "intermediate", mode: "online", location: null, availability: ["weekday_evening", "weekend_morning"], interests: ["Algorithms", "Interview prep", "Problem solving"], skills: ["Algorithms", "Data structures", "Python"], maxMembers: 6, owner: 2, members: [5] },
  { n: 2, name: "LeetCode Weekend Warriors", subject: "Algorithms", description: "Long weekend grinds on hard problems. Strong coders only; Java and C++ welcome.", level: "advanced", mode: "online", location: null, availability: ["weekend_morning", "weekend_afternoon"], interests: ["Algorithms", "Interview prep", "Competitive programming"], skills: ["Algorithms", "Data structures", "Java"], maxMembers: 8, owner: 7, members: [] },
  { n: 3, name: "Singapore Algo Study Circle", subject: "Algorithms", description: "Meet in person near the CBD on weekday evenings to work through interview questions together.", level: "intermediate", mode: "in_person", location: "Singapore", availability: ["weekday_evening"], interests: ["Algorithms", "Interview prep"], skills: ["Algorithms", "Data structures", "Python"], maxMembers: 5, owner: 8, members: [3] },
  { n: 4, name: "Competitive Programming Club", subject: "Algorithms", description: "Contest practice and upsolving. Small, serious, and currently full.", level: "advanced", mode: "hybrid", location: "Singapore", availability: ["weekday_evening", "weekend_afternoon"], interests: ["Competitive programming", "Algorithms"], skills: ["Algorithms", "Data structures", "C++"], maxMembers: 3, owner: 6, members: [9, 10] },
  { n: 5, name: "Databases & SQL Lab", subject: "Databases", description: "Schema design, indexing and query tuning on real datasets. Bring a laptop.", level: "intermediate", mode: "hybrid", location: "Singapore", availability: ["weekday_evening"], interests: ["Databases", "Backend development"], skills: ["SQL", "Databases"], maxMembers: 6, owner: 11, members: [12] },
  { n: 6, name: "Operating Systems Deep Dive", subject: "Operating systems", description: "Scheduling, memory and file systems, with C exercises from the xv6 labs.", level: "advanced", mode: "in_person", location: "Toronto", availability: ["weekday_evening", "weekend_morning"], interests: ["Systems programming", "Operating systems"], skills: ["Operating systems", "C", "Computer networks"], maxMembers: 5, owner: 9, members: [] },
  { n: 7, name: "Intro to Programming with Python", subject: "Programming", description: "Absolute beginners welcome. Weekly exercises and a small project.", level: "beginner", mode: "online", location: null, availability: ["weekday_morning", "weekday_evening", "weekend_morning"], interests: ["Python", "Programming basics"], skills: ["Python", "Data structures"], maxMembers: 8, owner: 3, members: [4, 12] },

  // --- Machine learning and data ---
  { n: 8, name: "ML Foundations", subject: "Machine learning", description: "Work through a standard ML course together: regression, trees, evaluation, and a final project.", level: "intermediate", mode: "online", location: null, availability: ["weekday_evening", "weekend_afternoon"], interests: ["Machine learning", "Data science"], skills: ["Machine learning", "Statistics", "Python"], maxMembers: 6, owner: 4, members: [] },
  { n: 9, name: "Deep Learning Reading Group", subject: "Deep learning", description: "One paper a week, presented by a member and torn apart by everyone else.", level: "advanced", mode: "online", location: null, availability: ["weekday_evening", "weekend_evening"], interests: ["Machine learning", "Research", "Deep learning"], skills: ["Deep learning", "Machine learning", "Python"], maxMembers: 8, owner: 5, members: [2] },
  { n: 10, name: "Data Analysis with Python", subject: "Data analysis", description: "Pandas, plotting and storytelling with data, in a relaxed weekend format.", level: "beginner", mode: "hybrid", location: "Singapore", availability: ["weekend_morning", "weekend_afternoon"], interests: ["Data science", "Data analysis"], skills: ["Data analysis", "Python", "Data visualization"], maxMembers: 6, owner: 10, members: [11] },
  { n: 11, name: "Statistics Survival Guide", subject: "Statistics", description: "Weekday daytime sessions to get through an intro statistics course.", level: "beginner", mode: "online", location: null, availability: ["weekday_morning", "weekday_afternoon"], interests: ["Statistics", "Exam prep"], skills: ["Statistics", "Probability"], maxMembers: 10, owner: 12, members: [] },
  { n: 12, name: "Kaggle Teamup", subject: "Machine learning", description: "Form a team, pick a live competition, and ship a submission. Currently full.", level: "intermediate", mode: "hybrid", location: "Singapore", availability: ["weekend_morning", "weekend_afternoon"], interests: ["Machine learning", "Data science", "Competitions"], skills: ["Machine learning", "Data analysis", "Python"], maxMembers: 3, owner: 11, members: [4, 9] },
  { n: 13, name: "Probability & Stats for ML", subject: "Statistics", description: "The maths behind the models: distributions, estimation and Bayesian thinking.", level: "intermediate", mode: "online", location: null, availability: ["weekday_evening"], interests: ["Statistics", "Machine learning", "Research"], skills: ["Probability", "Statistics", "Linear algebra"], maxMembers: 6, owner: 7, members: [] },

  // --- Web ---
  { n: 14, name: "Full-Stack Next.js Builders", subject: "Web development", description: "Ship a small product in eight weeks with React, Next.js and a Postgres backend.", level: "intermediate", mode: "hybrid", location: "Bangalore", availability: ["weekday_evening", "weekend_morning"], interests: ["Web development", "Startups", "Full-stack"], skills: ["React", "Next.js", "TypeScript", "Node.js"], maxMembers: 6, owner: 12, members: [8] },
  { n: 15, name: "Frontend Fundamentals", subject: "Web development", description: "HTML, CSS, JavaScript and React from the ground up, with weekly small builds.", level: "beginner", mode: "online", location: null, availability: ["weekend_morning", "weekend_afternoon"], interests: ["Web development", "Design"], skills: ["HTML & CSS", "JavaScript", "React"], maxMembers: 8, owner: 4, members: [9, 10, 11] },
  { n: 16, name: "TypeScript Deep Dive", subject: "TypeScript", description: "Generics, conditional types and real-world typing patterns. Not for beginners.", level: "advanced", mode: "online", location: null, availability: ["weekday_evening"], interests: ["Web development", "Type systems"], skills: ["TypeScript", "JavaScript", "Software engineering"], maxMembers: 6, owner: 8, members: [] },
  { n: 17, name: "REST API Design Club", subject: "Backend development", description: "Design, build and review APIs together. Node, SQL and a lot of opinions.", level: "intermediate", mode: "hybrid", location: "London", availability: ["weekday_evening", "weekend_afternoon"], interests: ["Backend development", "API design"], skills: ["REST APIs", "Node.js", "SQL"], maxMembers: 6, owner: 6, members: [11] },
  { n: 18, name: "Web Security Basics", subject: "Cybersecurity", description: "The OWASP top ten, hands-on, using deliberately vulnerable apps.", level: "beginner", mode: "online", location: null, availability: ["weekday_evening", "weekend_evening"], interests: ["Cybersecurity", "Web development"], skills: ["Cybersecurity", "JavaScript", "REST APIs"], maxMembers: 8, owner: 12, members: [5] },

  // --- Mathematics ---
  { n: 19, name: "Calculus Crash Course", subject: "Calculus", description: "Limits, derivatives and integrals in small in-person groups. Currently full.", level: "beginner", mode: "in_person", location: "London", availability: ["weekday_afternoon", "weekday_morning"], interests: ["Mathematics", "Exam prep"], skills: ["Calculus"], maxMembers: 4, owner: 3, members: [5, 6, 7] },
  { n: 20, name: "Linear Algebra for Everyone", subject: "Linear algebra", description: "Vectors, matrices and eigenvalues, with an eye on machine learning applications.", level: "intermediate", mode: "online", location: null, availability: ["weekday_evening", "weekend_morning"], interests: ["Mathematics", "Machine learning"], skills: ["Linear algebra", "Calculus"], maxMembers: 8, owner: 9, members: [2] },
  { n: 21, name: "Discrete Math & Proofs", subject: "Discrete mathematics", description: "Logic, induction, graphs and counting, with plenty of proof practice.", level: "intermediate", mode: "online", location: null, availability: ["weekday_evening", "weekend_afternoon"], interests: ["Mathematics", "Proofs", "Algorithms"], skills: ["Discrete mathematics", "Algorithms"], maxMembers: 6, owner: 10, members: [] },
  { n: 22, name: "Probability Problem Solving", subject: "Probability", description: "Counting, conditional probability and puzzles that make you think.", level: "intermediate", mode: "hybrid", location: "Toronto", availability: ["weekend_afternoon", "weekday_evening"], interests: ["Probability", "Mathematics", "Problem solving"], skills: ["Probability", "Discrete mathematics"], maxMembers: 6, owner: 7, members: [] },

  // --- Science and other subjects ---
  { n: 23, name: "Physics Problem Sets", subject: "Physics", description: "Mechanics and electromagnetism problem sets, worked on a whiteboard.", level: "intermediate", mode: "in_person", location: "London", availability: ["weekday_afternoon"], interests: ["Physics", "Exam prep"], skills: ["Physics", "Calculus"], maxMembers: 5, owner: 9, members: [] },
  { n: 24, name: "Organic Chemistry Study Hall", subject: "Chemistry", description: "Reaction mechanisms and past-paper drills, weekend afternoons.", level: "intermediate", mode: "in_person", location: "Bangalore", availability: ["weekend_afternoon"], interests: ["Chemistry", "Exam prep"], skills: ["Chemistry"], maxMembers: 6, owner: 11, members: [2] },
  { n: 25, name: "Biology Exam Prep", subject: "Biology", description: "Cell biology and genetics, flashcards and mock exams.", level: "intermediate", mode: "in_person", location: "Bangalore", availability: ["weekend_afternoon", "weekend_morning"], interests: ["Biology", "Exam prep"], skills: ["Biology", "Chemistry"], maxMembers: 6, owner: 2, members: [] },
  { n: 26, name: "Economics Reading Circle", subject: "Economics", description: "Read and debate a chapter or paper each week, from micro to macro.", level: "intermediate", mode: "hybrid", location: "Singapore", availability: ["weekday_evening"], interests: ["Economics", "Research"], skills: ["Economics", "Statistics"], maxMembers: 8, owner: 8, members: [] },
  { n: 27, name: "Academic Writing Workshop", subject: "Academic writing", description: "Peer review for essays and theses, plus practice talks.", level: "beginner", mode: "hybrid", location: "London", availability: ["weekday_afternoon", "weekday_morning"], interests: ["Writing", "Presentations"], skills: ["Academic writing", "Public speaking"], maxMembers: 6, owner: 10, members: [12] },
  { n: 28, name: "Accounting Basics", subject: "Accounting", description: "Ledgers, statements and the logic behind them, for first-time learners.", level: "beginner", mode: "online", location: null, availability: ["weekday_evening", "weekend_morning"], interests: ["Accounting", "Finance"], skills: ["Accounting", "Economics"], maxMembers: 10, owner: 6, members: [] },
];
