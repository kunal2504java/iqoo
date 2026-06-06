// Seed data — this is a feature, not a shortcut. It carries the two-campus
// personalization demo (Profile A vs B) and the reverse-discovery candidate list.
// buildSeed() returns a fresh deep copy each call so /admin/reset works cleanly.

import type { User, Post, Stats, CalendarEvent } from "./types.js";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const hoursFromNow = (h: number) => new Date(now + h * 3600_000).toISOString();
const daysAgo = (d: number) => hoursAgo(d * 24);
// Calendar dates are relative to "now" so a deadline is always genuinely "in N days" on stage.
const dayISO = (n: number) => new Date(now + n * 86400_000).toISOString().slice(0, 10);
const fmtDateTime = (d: Date) => d.toISOString().slice(0, 10) + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");

// ── Users ─────────────────────────────────────────────────────────────────
// Profile A = u_aarav (final-year CSE, placements). Profile B = u_diya (fresher, clubs/sports).
// Each user gets a seeded campus location (lat/lng) for the live map demo.
// Coordinates approximate a real campus around 28.5459, 77.1926 (IIT Delhi area).
function users(): User[] {
  return [
    { id: "u_aarav", name: "Aarav Mehta", role: "senior", branch: "CSE", year: "4",
      interests: ["Placements", "DSA", "System Design", "Web Dev", "Interview Prep", "Backend"],
      avatar: "🦉", points: 340, lat: 28.5465, lng: 77.1920, last_active: hoursAgo(1), created_at: daysAgo(400) },
    { id: "u_diya", name: "Diya Sharma", role: "student", branch: "ECE", year: "1",
      interests: ["Hackathons", "Cultural", "Sports", "Coding Club", "Robotics", "Music"],
      avatar: "🦋", points: 45, lat: 28.5445, lng: 77.1921, last_active: hoursAgo(2), created_at: daysAgo(40) },
    { id: "u_rohan", name: "Rohan Verma", role: "alumni", branch: "CSE", year: "alum",
      interests: ["Backend", "System Design", "Placements", "Startups"],
      avatar: "🚀", points: 890, lat: 28.5435, lng: 77.1926, last_active: hoursAgo(5), created_at: daysAgo(900) },
    { id: "u_neha", name: "Neha Iyer", role: "senior", branch: "CSE", year: "4",
      interests: ["DSA", "ML/AI", "Placements", "Research"], avatar: "🧠", points: 280,
      lat: 28.5460, lng: 77.1915, last_active: hoursAgo(1), created_at: daysAgo(380) },
    { id: "u_kabir", name: "Kabir Singh", role: "student", branch: "Mechanical", year: "3",
      interests: ["GATE", "Core Mechanical", "Thermodynamics", "Robotics"], avatar: "⚙️", points: 195,
      lat: 28.5459, lng: 77.1927, last_active: hoursAgo(3), created_at: daysAgo(300) },
    { id: "u_ananya", name: "Ananya Rao", role: "student", branch: "CSE", year: "3",
      interests: ["Web Dev", "Design", "Hackathons", "Frontend", "Placements"], avatar: "🎨", points: 120,
      lat: 28.5455, lng: 77.1932, last_active: hoursAgo(4), created_at: daysAgo(280) },
    { id: "u_vikram", name: "Vikram Nair", role: "student", branch: "CSE", year: "4",
      interests: ["DSA", "Backend", "Placements", "Competitive Programming"], avatar: "🏆", points: 410,
      lat: 28.5464, lng: 77.1921, last_active: hoursAgo(1), created_at: daysAgo(360) },
    { id: "u_sara", name: "Sara Khan", role: "student", branch: "ECE", year: "2",
      interests: ["Cultural", "Music", "Design", "Photography"], avatar: "🎭", points: 85,
      lat: 28.5440, lng: 77.1930, last_active: hoursAgo(6), created_at: daysAgo(150) },
    { id: "u_arjun", name: "Arjun Patel", role: "student", branch: "CSE", year: "3",
      interests: ["System Design", "Backend", "Web Dev", "Placements", "Hackathons"], avatar: "💻", points: 215,
      lat: 28.5461, lng: 77.1916, last_active: hoursAgo(2), created_at: daysAgo(270) },
    { id: "u_ishita", name: "Ishita Gupta", role: "student", branch: "IT", year: "4",
      interests: ["DSA", "Web Dev", "Placements", "Interview Prep", "Frontend"], avatar: "⭐", points: 175,
      lat: 28.5458, lng: 77.1928, last_active: hoursAgo(3), created_at: daysAgo(350) },
    { id: "u_dev", name: "Dev Malhotra", role: "student", branch: "CSE", year: "2",
      interests: ["Coding Club", "Hackathons", "Web Dev", "Sports"], avatar: "🎮", points: 95,
      lat: 28.5441, lng: 77.1931, last_active: hoursAgo(8), created_at: daysAgo(140) },
    { id: "u_priya", name: "Priya Menon", role: "senior", branch: "Chemical", year: "4",
      interests: ["GATE", "Core", "Research", "Placements"], avatar: "🔬", points: 260,
      lat: 28.5446, lng: 77.1919, last_active: hoursAgo(4), created_at: daysAgo(370) },
    { id: "u_tanvi", name: "Tanvi Joshi", role: "student", branch: "CSE", year: "1",
      interests: ["Hackathons", "Coding Club", "Sports", "Cultural"], avatar: "🌱", points: 30,
      lat: 28.5444, lng: 77.1922, last_active: hoursAgo(10), created_at: daysAgo(35) },
    { id: "u_office", name: "Campus Office", role: "admin", branch: "Admin", year: "staff",
      interests: ["Announcements"], avatar: "🏛️", points: 0,
      lat: 28.5462, lng: 77.1925, last_active: hoursAgo(24), created_at: daysAgo(1000) },
  ];
}

// ── Posts ─────────────────────────────────────────────────────────────────
function note(p: Partial<Post> & { id: string; author_id: string; title: string }): Post {
  return {
    type: "note", description: "", status: "enriched", topic_tags: [],
    branch_relevance: [], year_relevance: [], trust: { verified_by: 0, topped_exam: 0 },
    tip_count: 0, created_at: daysAgo(3), ...p,
  } as Post;
}

function posts(): Post[] {
  return [
    // ── Notes (carry note-detail + Ghost Senior even with no API key) ──
    note({
      id: "p_thermo", author_id: "u_kabir",
      title: "Thermodynamics — First Law & Applications",
      description: "Handwritten Hindi-English notes — पहला नियम, internal energy, work done.",
      topic_tags: ["Thermodynamics", "First Law", "GATE", "Core Mechanical"],
      branch_relevance: ["Mechanical", "Chemical"], year_relevance: ["2", "3"],
      trust: { verified_by: 7, topped_exam: 2 }, created_at: daysAgo(2),
      enrichment: {
        language: "mixed",
        extracted_text:
          "First Law of Thermodynamics (ऊष्मागतिकी का पहला नियम):\n" +
          "ΔU = Q − W\n" +
          "Q = heat added to the system (system को दी गई ऊष्मा)\n" +
          "W = work done BY the system (system द्वारा किया गया कार्य)\n" +
          "ΔU = change in internal energy (आंतरिक ऊर्जा में परिवर्तन)\n\n" +
          "Sign convention: Q positive जब heat add किया जाए, W positive जब system expand करे.\n" +
          "Isothermal process: ΔU = 0, so Q = W.\n" +
          "Adiabatic process: Q = 0, so ΔU = −W.\n" +
          "It is just conservation of energy — energy न बनती है न नष्ट होती है, only converts.",
        summary:
          "The First Law of Thermodynamics is conservation of energy for a system: ΔU = Q − W. Heat added minus work done by the system equals the change in internal energy. Special cases: isothermal (ΔU=0, Q=W) and adiabatic (Q=0, ΔU=−W).",
        key_points: [
          "ΔU = Q − W — change in internal energy = heat added − work done by system.",
          "Sign convention: Q is +ve when heat is added; W is +ve when the system does work (expands).",
          "Isothermal process: temperature constant ⇒ ΔU = 0 ⇒ Q = W.",
          "Adiabatic process: no heat exchange ⇒ Q = 0 ⇒ ΔU = −W.",
          "It is fundamentally just the conservation of energy applied to a thermodynamic system.",
        ],
        flashcards: [
          { q: "State the First Law of Thermodynamics as an equation.", a: "ΔU = Q − W, where Q is heat added to the system and W is work done by the system." },
          { q: "In an isothermal process, what is ΔU and why?", a: "ΔU = 0, because internal energy depends only on temperature, which stays constant. Therefore Q = W." },
          { q: "What happens to ΔU in an adiabatic process?", a: "Q = 0, so ΔU = −W. Any work done by the system reduces its internal energy." },
          { q: "What is the sign of W when a gas is compressed?", a: "Negative — work is done ON the system, not by it." },
        ],
        resources: [
          { title: "First Law of Thermodynamics — Khan Academy", url: "https://www.khanacademy.org/science/physics/thermodynamics" },
          { title: "NPTEL: Basic Thermodynamics", url: "https://nptel.ac.in/courses/112105123" },
        ],
      },
    }),
    note({
      id: "p_dsa1", author_id: "u_vikram",
      title: "Dynamic Programming — patterns & recurrences",
      description: "The 6 DP patterns that cover 90% of interview questions.",
      topic_tags: ["DSA", "Placements", "Interview Prep", "Competitive Programming"],
      branch_relevance: ["CSE", "IT"], year_relevance: ["3", "4"],
      trust: { verified_by: 12, topped_exam: 3 }, created_at: daysAgo(1),
      enrichment: {
        language: "en",
        extracted_text:
          "Dynamic Programming patterns:\n1. 0/1 Knapsack — pick or skip, dp[i][w].\n2. Unbounded Knapsack — reuse items.\n3. Longest Common Subsequence — dp[i][j] over two strings.\n4. Longest Increasing Subsequence — dp[i] = best ending at i; O(n log n) with patience sort.\n5. Matrix Chain / interval DP — dp[i][j] over subarrays.\n6. DP on trees — post-order, combine children.\nKey: define state, transition, base case, order of evaluation.",
        summary:
          "Most interview DP problems reduce to one of six patterns: 0/1 knapsack, unbounded knapsack, LCS, LIS, interval DP, and tree DP. For each, the recipe is the same — define the state, the transition, the base case, and the evaluation order.",
        key_points: [
          "Always define: state, transition, base case, and evaluation order.",
          "0/1 vs unbounded knapsack differ only in whether you reuse an item.",
          "LCS and edit distance share the same 2D table shape over two strings.",
          "LIS is O(n log n) with patience sorting / binary search.",
          "Interval DP iterates over subarray lengths; tree DP combines children post-order.",
        ],
        flashcards: [
          { q: "What four things define any DP solution?", a: "State, transition, base case, and evaluation order." },
          { q: "Difference between 0/1 and unbounded knapsack?", a: "0/1 uses each item at most once; unbounded allows reusing items, changing the transition." },
          { q: "Optimal time complexity for Longest Increasing Subsequence?", a: "O(n log n) using patience sorting with binary search." },
        ],
        resources: [
          { title: "DP patterns — NeetCode", url: "https://neetcode.io/practice" },
          { title: "CP-Algorithms: Dynamic Programming", url: "https://cp-algorithms.com/dynamic_programming/" },
        ],
      },
    }),
    note({
      id: "p_sd1", author_id: "u_arjun",
      title: "System Design: Designing a URL shortener",
      description: "Capacity estimation, key generation, DB choice, caching.",
      topic_tags: ["System Design", "Backend", "Placements", "Interview Prep"],
      branch_relevance: ["CSE", "IT"], year_relevance: ["3", "4"],
      trust: { verified_by: 9, topped_exam: 2 }, created_at: daysAgo(2),
      enrichment: {
        language: "en",
        extracted_text:
          "URL shortener design:\n- Functional: shorten(long)->short, redirect(short)->long.\n- Scale: 100M new URLs/month, 10:1 read:write.\n- Key gen: base62 of an auto-increment ID, or hash + collision check.\n- Storage: KV store (short -> long). Cache hot keys in Redis.\n- Redirect: 301 vs 302 (302 keeps analytics).\n- Bottleneck: read-heavy, so cache aggressively + CDN.",
        summary:
          "A URL shortener is a read-heavy KV problem. Generate short keys with base62 of a unique ID, store short→long in a key-value store, and cache hot keys aggressively. Use 302 redirects if you want click analytics.",
        key_points: [
          "Two operations: shorten(long)→short and redirect(short)→long.",
          "Generate keys via base62 of an auto-increment ID to avoid collisions.",
          "It's read-heavy (≈10:1) — cache hot keys in Redis and front with a CDN.",
          "302 redirects preserve analytics; 301 are cached by browsers.",
        ],
        flashcards: [
          { q: "Why base62 encode an auto-increment ID for the short key?", a: "It's collision-free, compact, and URL-safe (a–z, A–Z, 0–9)." },
          { q: "301 vs 302 redirect for a URL shortener?", a: "302 (temporary) lets you keep click analytics; 301 (permanent) gets cached by browsers and skips your server." },
        ],
        resources: [
          { title: "System Design Primer — URL shortener", url: "https://github.com/donnemartin/system-design-primer" },
          { title: "Grokking the System Design Interview", url: "https://www.educative.io/courses/grokking-the-system-design-interview" },
        ],
      },
    }),
    note({
      id: "p_os", author_id: "u_neha",
      title: "Operating Systems — Deadlocks & Banker's Algorithm",
      description: "Coffman conditions, detection, avoidance.",
      topic_tags: ["OS", "Placements", "GATE", "Interview Prep"],
      branch_relevance: ["CSE", "IT"], year_relevance: ["2", "3"],
      trust: { verified_by: 8, topped_exam: 1 }, created_at: daysAgo(4),
      enrichment: {
        language: "en",
        extracted_text:
          "Deadlock = circular wait for resources.\nCoffman conditions (all 4 needed): mutual exclusion, hold-and-wait, no preemption, circular wait.\nHandling: prevention (break a condition), avoidance (Banker's algorithm), detection+recovery, or ignore (ostrich).\nBanker's: grant a request only if the resulting state is 'safe' (a safe sequence exists).",
        summary:
          "A deadlock needs all four Coffman conditions simultaneously. You can prevent it by breaking one, avoid it with the Banker's algorithm (only granting requests that keep the system in a safe state), or detect-and-recover.",
        key_points: [
          "Four Coffman conditions: mutual exclusion, hold-and-wait, no preemption, circular wait.",
          "Break any one condition to prevent deadlock.",
          "Banker's algorithm grants a request only if a safe sequence still exists.",
          "Alternatives: detection+recovery, or the 'ostrich' approach (ignore).",
        ],
        flashcards: [
          { q: "Name the four Coffman conditions for deadlock.", a: "Mutual exclusion, hold-and-wait, no preemption, and circular wait — all four must hold." },
          { q: "What does the Banker's algorithm check before granting a request?", a: "Whether the resulting state is 'safe' — i.e., a sequence exists in which every process can finish." },
        ],
        resources: [{ title: "OSTEP — Deadlock", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/" }],
      },
    }),
    note({
      id: "p_dbms", author_id: "u_ishita",
      title: "DBMS — Normalization (1NF → BCNF)",
      description: "Functional dependencies and the normal forms with examples.",
      topic_tags: ["DBMS", "Placements", "GATE", "Interview Prep"],
      branch_relevance: ["CSE", "IT"], year_relevance: ["2", "3"],
      trust: { verified_by: 10, topped_exam: 2 }, created_at: daysAgo(5),
      enrichment: {
        language: "en",
        extracted_text:
          "Normalization removes redundancy via functional dependencies (FDs).\n1NF: atomic values, no repeating groups.\n2NF: 1NF + no partial dependency on part of a composite key.\n3NF: 2NF + no transitive dependency (non-key -> non-key).\nBCNF: every determinant is a candidate key.",
        summary:
          "Normalization uses functional dependencies to remove redundancy. 1NF needs atomic columns; 2NF removes partial dependencies; 3NF removes transitive dependencies; BCNF requires every determinant to be a candidate key.",
        key_points: [
          "1NF: atomic values, no repeating groups.",
          "2NF: no partial dependency on part of a composite key.",
          "3NF: no transitive dependency (non-key → non-key).",
          "BCNF: every determinant must be a candidate key (stricter than 3NF).",
        ],
        flashcards: [
          { q: "What does 3NF remove that 2NF does not?", a: "Transitive dependencies — where a non-key attribute depends on another non-key attribute." },
          { q: "When is a relation in BCNF but a table in 3NF might not be?", a: "BCNF requires every determinant to be a candidate key; 3NF allows a non-candidate-key determinant if the dependent attribute is prime." },
        ],
        resources: [{ title: "Database normalization — GeeksforGeeks", url: "https://www.geeksforgeeks.org/normal-forms-in-dbms/" }],
      },
    }),
    note({
      id: "p_apt", author_id: "u_aarav",
      title: "Quant Aptitude — Time & Work shortcuts",
      description: "LCM method, efficiency ratios, pipes & cisterns.",
      topic_tags: ["Aptitude", "Placements", "Interview Prep"],
      branch_relevance: ["CSE", "IT", "ECE", "Mechanical"], year_relevance: ["3", "4"],
      trust: { verified_by: 14, topped_exam: 4 }, created_at: daysAgo(3),
      enrichment: {
        language: "en",
        extracted_text:
          "Time & Work — LCM method:\nTake total work = LCM of the days each person takes. Each person's rate = total/days.\nCombined rate = sum of rates. Time = total work / combined rate.\nPipes & cisterns: outlet pipe rate is negative.",
        summary:
          "Solve Time & Work fast with the LCM method: set total work to the LCM of individual times, convert each worker to a per-day rate, add the rates, and divide. For pipes & cisterns, treat an outlet as a negative rate.",
        key_points: [
          "Set total work = LCM of the individual completion times.",
          "Each worker's rate = total work ÷ their days.",
          "Combined rate = sum of individual rates; time = total ÷ combined rate.",
          "Pipes & cisterns: an outlet pipe contributes a negative rate.",
        ],
        flashcards: [
          { q: "A does a job in 10 days, B in 15. How long together (LCM method)?", a: "LCM(10,15)=30 units. Rates 3 and 2 → 5/day → 30/5 = 6 days." },
        ],
        resources: [{ title: "IndiaBix — Time and Work", url: "https://www.indiabix.com/aptitude/time-and-work/" }],
      },
    }),
    note({
      id: "p_react", author_id: "u_ananya",
      title: "React Hooks — crash notes",
      description: "useState, useEffect deps, useMemo vs useCallback.",
      topic_tags: ["Web Dev", "Frontend", "Hackathons"],
      branch_relevance: ["CSE", "IT", "ECE"], year_relevance: ["2", "3"],
      trust: { verified_by: 6, topped_exam: 0 }, created_at: daysAgo(6),
      enrichment: {
        language: "en",
        extracted_text:
          "useState: returns [value, setter]; setter is async + batched.\nuseEffect(fn, deps): runs after render; empty deps = once; cleanup return.\nuseMemo memoizes a value; useCallback memoizes a function reference.\nRules of hooks: only call at top level, only from React functions.",
        summary:
          "React hooks let function components hold state and side effects. useState gives a batched setter, useEffect runs after render with a dependency array, and useMemo/useCallback memoize values vs function references. Always follow the rules of hooks.",
        key_points: [
          "useState's setter is asynchronous and batched.",
          "useEffect runs after render; empty deps = run once; return a cleanup function.",
          "useMemo caches a computed value; useCallback caches a function reference.",
          "Rules of hooks: call only at the top level, only inside React functions.",
        ],
        flashcards: [
          { q: "useMemo vs useCallback?", a: "useMemo memoizes a computed value; useCallback memoizes a function reference. useCallback(fn,deps) === useMemo(()=>fn,deps)." },
          { q: "What does an empty dependency array in useEffect mean?", a: "The effect runs once after the initial render and the cleanup runs on unmount." },
        ],
        resources: [{ title: "React docs — Hooks", url: "https://react.dev/reference/react/hooks" }],
      },
    }),
    note({
      id: "p_cn", author_id: "u_ishita",
      title: "Computer Networks — OSI vs TCP/IP",
      description: "Layer-by-layer mapping with protocols.",
      topic_tags: ["CN", "Placements", "GATE"],
      branch_relevance: ["CSE", "IT", "ECE"], year_relevance: ["2", "3"],
      trust: { verified_by: 7, topped_exam: 1 }, created_at: daysAgo(7),
      enrichment: {
        language: "en",
        extracted_text:
          "OSI has 7 layers: Physical, Data Link, Network, Transport, Session, Presentation, Application.\nTCP/IP collapses these to 4: Link, Internet, Transport, Application.\nKey protocols: IP (network), TCP/UDP (transport), HTTP/DNS (application).",
        summary:
          "The OSI model has 7 layers; the practical TCP/IP model collapses them into 4. Know which protocol lives where: IP at the network layer, TCP/UDP at transport, HTTP/DNS at application.",
        key_points: [
          "OSI: Physical, Data Link, Network, Transport, Session, Presentation, Application.",
          "TCP/IP collapses OSI into 4 layers: Link, Internet, Transport, Application.",
          "IP → network; TCP/UDP → transport; HTTP/DNS → application.",
        ],
        flashcards: [
          { q: "How many layers in OSI vs TCP/IP?", a: "OSI has 7 layers; TCP/IP has 4." },
          { q: "Which layer does TCP operate at?", a: "The transport layer." },
        ],
        resources: [{ title: "Computer Networking: A Top-Down Approach", url: "https://gaia.cs.umass.edu/kurose_ross/" }],
      },
    }),

    // ── Drives (one is the reverse-discovery drive: p_drive_sde) ──
    {
      id: "p_drive_sde", type: "drive", author_id: "u_rohan",
      title: "SDE-1 (Backend) — Razorpay Campus Drive",
      description: "Hiring 2026 batch for backend engineering. Build payment infra at scale.",
      status: "enriched",
      topic_tags: ["Placements", "Backend", "System Design", "DSA"],
      branch_relevance: ["CSE", "IT"], year_relevance: ["4"],
      trust: { verified_by: 4, topped_exam: 0 }, tip_count: 0, created_at: hoursAgo(20),
      drive: { role: "SDE-1 (Backend)", ctc: "₹18 LPA", eligibility: "CSE/IT · CGPA ≥ 7.0 · 2026 batch", deadline: "2026-06-20" },
    },
    {
      id: "p_drive_ds", type: "drive", author_id: "u_office",
      title: "Data Science Intern — Flipkart",
      description: "6-month internship with PPO. Work on recommendation systems.",
      status: "enriched",
      topic_tags: ["Placements", "ML/AI", "Internship", "Research"],
      branch_relevance: ["CSE", "IT"], year_relevance: ["3", "4"],
      trust: { verified_by: 3, topped_exam: 0 }, tip_count: 0, created_at: daysAgo(2),
      drive: { role: "Data Science Intern", ctc: "₹80k/month", eligibility: "CSE/IT · ML coursework · 3rd/4th year", deadline: "2026-06-16" },
    },
    {
      id: "p_drive_core", type: "drive", author_id: "u_office",
      title: "Graduate Engineer Trainee — Tata Motors",
      description: "Core mechanical roles in powertrain & manufacturing.",
      status: "enriched",
      topic_tags: ["Placements", "Core Mechanical", "GATE"],
      branch_relevance: ["Mechanical", "Chemical"], year_relevance: ["4"],
      trust: { verified_by: 2, topped_exam: 0 }, tip_count: 0, created_at: daysAgo(3),
      drive: { role: "Graduate Engineer Trainee", ctc: "₹9 LPA", eligibility: "Mechanical/Chemical · CGPA ≥ 6.5", deadline: "2026-06-25" },
    },
    {
      id: "p_drive_fe", type: "drive", author_id: "u_rohan",
      title: "Frontend Intern — Zomato",
      description: "React + TypeScript. Ship to millions of users.",
      status: "enriched",
      topic_tags: ["Placements", "Frontend", "Web Dev", "Internship"],
      branch_relevance: ["CSE", "IT", "ECE"], year_relevance: ["3", "4"],
      trust: { verified_by: 5, topped_exam: 0 }, tip_count: 0, created_at: daysAgo(1),
      drive: { role: "Frontend Engineering Intern", ctc: "₹60k/month", eligibility: "Any branch · strong React portfolio", deadline: "2026-06-18" },
    },

    // ── Events (seeded with realistic times relative to "now" for the live feed demo) ──
    // LIVE NOW — started 30 min ago, still running
    {
      id: "p_event_live", type: "event", author_id: "u_neha",
      title: "Intro to ML — Hands-on Workshop",
      description: "Build your first neural net. Laptops required. Room 302.",
      status: "enriched",
      topic_tags: ["ML/AI", "Workshop", "Coding Club"],
      branch_relevance: ["CSE", "IT", "ECE"], year_relevance: ["2", "3", "4"],
      trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0, created_at: hoursAgo(1),
      event: { venue: "CS Lab 302", start_time: fmtDateTime(new Date(now - 30 * 60_000)), rsvp_count: 56, rsvp_users: ["u_aarav", "u_vikram", "u_ananya", "u_ishita", "u_dev", "u_tanvi"] },
    },
    // STARTING IN 1 HOUR
    {
      id: "p_event_soon", type: "event", author_id: "u_dev",
      title: "Coding Club — Competitive Programming Sprint",
      description: "2-hour speed contest. Prizes for top 3. Bring your A-game.",
      status: "enriched",
      topic_tags: ["Coding Club", "Competitive Programming", "Hackathons"],
      branch_relevance: ["CSE", "IT", "ECE"], year_relevance: ["1", "2", "3", "4"],
      trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0, created_at: hoursAgo(2),
      event: { venue: "Innovation Hall", start_time: fmtDateTime(new Date(now + 60 * 60_000)), rsvp_count: 84, rsvp_users: ["u_aarav", "u_vikram", "u_arjun", "u_dev", "u_ishita", "u_tanvi", "u_diya"] },
    },
    // STARTING IN 3 HOURS
    {
      id: "p_event_later", type: "event", author_id: "u_aarav",
      title: "Placement Mock Interviews — Slot Open",
      description: "Seniors playing interviewer. Sign up fast, slots limited.",
      status: "enriched",
      topic_tags: ["Placements", "Interview Prep", "Senior"],
      branch_relevance: ["CSE", "IT"], year_relevance: ["3", "4"],
      trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0, created_at: hoursAgo(4),
      event: { venue: "Seminar Hall B", start_time: fmtDateTime(new Date(now + 180 * 60_000)), rsvp_count: 32, rsvp_users: ["u_vikram", "u_ishita", "u_priya"] },
    },
    // TONIGHT
    {
      id: "p_event_tonight", type: "event", author_id: "u_sara",
      title: "Open Mic Night — June Edition",
      description: "Poetry, stand-up, music. The canteen terrace after dark.",
      status: "enriched",
      topic_tags: ["Cultural", "Music", "Dance"],
      branch_relevance: ["CSE", "IT", "ECE", "Mechanical", "Chemical"], year_relevance: ["1", "2", "3", "4"],
      trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0, created_at: hoursAgo(6),
      event: { venue: "Canteen Terrace", start_time: fmtDateTime(new Date(now + 480 * 60_000)), rsvp_count: 120, rsvp_users: ["u_sara", "u_diya", "u_dev", "u_tanvi"] },
    },
    // TOMORROW
    {
      id: "p_event_tomorrow", type: "event", author_id: "u_office",
      title: "Career Fair 2026 — Company Booths",
      description: "30+ companies on campus. Resumes ready?",
      status: "enriched",
      topic_tags: ["Placements", "Career"],
      branch_relevance: ["CSE", "IT", "ECE", "Mechanical", "Chemical"], year_relevance: ["3", "4"],
      trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0, created_at: daysAgo(1),
      event: { venue: "Main Auditorium", start_time: fmtDateTime(new Date(now + 20 * 3600_000)), rsvp_count: 340, rsvp_users: ["u_aarav", "u_vikram", "u_neha", "u_priya", "u_ishita", "u_arjun"] },
    },
    // IN 2 DAYS
    {
      id: "p_event_hack", type: "event", author_id: "u_dev",
      title: "HackQuad 2026 — 24hr Hackathon",
      description: "Build anything. ₹1L prize pool. Teams of 4.",
      status: "enriched",
      topic_tags: ["Hackathons", "Coding Club", "Web Dev"],
      branch_relevance: ["CSE", "IT", "ECE", "Mechanical"], year_relevance: ["1", "2", "3", "4"],
      trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0, created_at: daysAgo(1),
      event: { venue: "Innovation Hall", start_time: fmtDateTime(new Date(now + 48 * 3600_000)), rsvp_count: 128, rsvp_users: ["u_dev", "u_ananya", "u_diya", "u_tanvi"] },
    },

    // ── Announcements ──
    {
      id: "p_ann_orientation", type: "announcement", author_id: "u_office",
      title: "Freshers' Orientation 2026 — Schedule",
      description: "Welcome to the 2026 batch! Orientation week schedule inside.",
      status: "enriched",
      topic_tags: ["Announcements", "Fresher", "Cultural"],
      branch_relevance: ["CSE", "IT", "ECE", "Mechanical", "Chemical"], year_relevance: ["1"],
      trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0, created_at: daysAgo(1),
    },
    {
      id: "p_ann_exam", type: "announcement", author_id: "u_office",
      title: "End-Sem Exam Datesheet Released",
      description: "Datesheet for all branches is now live on the portal.",
      status: "enriched",
      topic_tags: ["Announcements", "Exams"],
      branch_relevance: ["CSE", "IT", "ECE", "Mechanical", "Chemical"], year_relevance: ["1", "2", "3", "4"],
      trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0, created_at: daysAgo(2),
    },
    {
      id: "p_ann_hostel", type: "announcement", author_id: "u_office",
      title: "Hostel Allotment for 2026 Batch",
      description: "Room allotment list and move-in dates for first-years.",
      status: "enriched",
      topic_tags: ["Announcements", "Fresher"],
      branch_relevance: ["CSE", "IT", "ECE", "Mechanical", "Chemical"], year_relevance: ["1"],
      trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0, created_at: daysAgo(5),
    },

    // ── Mess menu (DEMO — parsed + searchable) ──
    {
      id: "p_menu", type: "menu", author_id: "u_office",
      title: "Mess Menu — This Week",
      description: "Breakfast / Lunch / Dinner for all 7 days. Paneer on Wednesday 🎉",
      status: "enriched",
      topic_tags: ["Menu", "Food"],
      branch_relevance: ["CSE", "IT", "ECE", "Mechanical", "Chemical"], year_relevance: ["1", "2", "3", "4"],
      trust: { verified_by: 0, topped_exam: 0 }, tip_count: 0, created_at: hoursAgo(12),
    },
  ];
}

// Reverse-discovery: students whose interests/contributions match a drive's tags.
// Seeded explicitly so the candidate list is curated and demo-credible.
function driveCandidates(): Record<string, string[]> {
  return {
    p_drive_sde: ["u_aarav", "u_vikram", "u_arjun", "u_ishita", "u_neha", "u_ananya"],
    p_drive_fe: ["u_ananya", "u_ishita", "u_dev"],
    p_drive_ds: ["u_neha", "u_aarav"],
    p_drive_core: ["u_kabir", "u_priya"],
  };
}

// F6 — the academic calendar: what the campus "remembers is coming". Dates are
// relative to today so deadlines are always live. evidence_post_ids point at
// existing high-trust notes; cleared_by is curated ("N seniors cleared it").
function calendar(): CalendarEvent[] {
  return [
    { id: "cal_gate", title: "GATE Registration", kind: "registration", date: dayISO(4),
      description: "Last date to register for GATE 2027.",
      branch_relevance: ["CSE", "IT", "ECE", "Mechanical", "Chemical"], year_relevance: ["3", "4"],
      topic_tags: ["GATE"], cleared_by: 3, evidence_post_ids: ["p_dbms", "p_os", "p_cn"] },
    { id: "cal_placement", title: "Placement Registration — Razorpay", kind: "registration", date: dayISO(7),
      description: "Register for the SDE campus drive before the window closes.",
      branch_relevance: ["CSE", "IT"], year_relevance: ["4"],
      topic_tags: ["Placements", "Backend", "DSA"], cleared_by: 5, evidence_post_ids: ["p_dsa1", "p_sd1", "p_apt"] },
    { id: "cal_ds", title: "Flipkart DS Intern — Application Deadline", kind: "deadline", date: dayISO(10),
      description: "Last date to apply for the Data Science internship.",
      branch_relevance: ["CSE", "IT"], year_relevance: ["3", "4"],
      topic_tags: ["ML/AI", "Placements", "Internship"], cleared_by: 2, evidence_post_ids: ["p_dsa1"] },
    { id: "cal_midsem", title: "Mid-Sem Exams", kind: "exam", date: dayISO(9),
      description: "Mid-semester examinations begin.",
      branch_relevance: ["CSE", "IT", "ECE", "Mechanical", "Chemical"], year_relevance: ["1", "2", "3"],
      topic_tags: ["Exams"], cleared_by: 0, evidence_post_ids: ["p_dbms", "p_os", "p_thermo"] },
    { id: "cal_hack", title: "HackQuad 2026", kind: "fest", date: dayISO(8),
      description: "24-hour campus hackathon. Teams of 4.",
      branch_relevance: [], year_relevance: ["1", "2", "3", "4"],
      topic_tags: ["Hackathons", "Coding Club", "Web Dev"], cleared_by: 0, evidence_post_ids: ["p_react"] },
    { id: "cal_fest", title: "Rangmanch — Cultural Night", kind: "fest", date: dayISO(12),
      description: "The biggest cultural night of the year.",
      branch_relevance: [], year_relevance: ["1", "2", "3", "4"],
      topic_tags: ["Cultural", "Music", "Dance"], cleared_by: 0, evidence_post_ids: [] },
  ];
}

function stats(): Stats {
  return { notes: 412, drives: 38, enrichments: 1200 };
}

export interface SeedData {
  users: User[];
  posts: Post[];
  stats: Stats;
  driveCandidates: Record<string, string[]>;
  calendar: CalendarEvent[];
}

export function buildSeed(): SeedData {
  // structuredClone keeps the store fully isolated from these factory objects.
  return structuredClone({
    users: users(),
    posts: posts(),
    stats: stats(),
    driveCandidates: driveCandidates(),
    calendar: calendar(),
  });
}
