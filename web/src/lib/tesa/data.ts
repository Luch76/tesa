export const SKILLS = [
  "Insurance Verification",
  "Medical Terminology",
  "EHR Systems (Epic)",
  "HIPAA Compliance",
  "Scheduling & Patient Flow",
  "Customer Success Management",
  "CRM (Salesforce/HubSpot)",
  "Data Analysis (Excel)",
  "SQL",
  "Data Visualization (Tableau/Power BI)",
  "Python",
  "Customs & Trade Compliance",
  "Supply Chain Planning",
  "Freight & Logistics Coordination",
  "Revenue Management",
  "Hospitality Operations",
  "Service Recovery",
  "Security Monitoring (SIEM)",
  "Incident Response",
  "AML/KYC Compliance",
  "Legal Research & Drafting",
  "Process Improvement",
  "Project Coordination",
  "AI Tools & Prompting",
];
export const JOBS = [
  {
    id: "pa",
    title: "Patient Access Representative",
    employer: "Bayfront Community Health",
    sector: "Healthcare",
    hood: "Little Havana",
    pay: [40, 46],
    tier: "entry",
    years: 1,
    lang: "Spanish",
    soft: ["empathy", "composure", "communication"],
    reqs: [
      { s: "Insurance Verification", t: 3, m: 1 },
      { s: "Scheduling & Patient Flow", t: 3, m: 1 },
      { s: "EHR Systems (Epic)", t: 2, m: 1 },
      { s: "HIPAA Compliance", t: 2, m: 1 },
      { s: "Medical Terminology", t: 2, m: 0 },
    ],
    scn: {
      name: "The surprise bill",
      character: "Mrs. Ortiz, 68, Spanish-dominant, upset her MRI isn't fully covered",
      setting: "Front desk, busy Monday morning",
    },
  },
  {
    id: "pe",
    title: "Patient Experience Specialist",
    employer: "Kendall Family Medical",
    sector: "Healthcare",
    hood: "Kendall",
    pay: [42, 50],
    tier: "entry",
    years: 1,
    lang: "Spanish",
    soft: ["empathy", "communication", "composure"],
    reqs: [
      { s: "Service Recovery", t: 3, m: 1 },
      { s: "Scheduling & Patient Flow", t: 3, m: 1 },
      { s: "Medical Terminology", t: 2, m: 1 },
      { s: "HIPAA Compliance", t: 2, m: 0 },
    ],
    scn: {
      name: "Two-hour wait",
      character: "A father whose child's appointment is running two hours late",
      setting: "Pediatric waiting room",
    },
  },
  {
    id: "co",
    title: "Clinical Operations Coordinator",
    employer: "Coral Gables Specialty Partners",
    sector: "Healthcare",
    hood: "Coral Gables",
    pay: [55, 65],
    tier: "mid",
    years: 3,
    lang: "",
    soft: ["problem_solving", "communication", "professionalism"],
    reqs: [
      { s: "Scheduling & Patient Flow", t: 4, m: 1 },
      { s: "Process Improvement", t: 3, m: 1 },
      { s: "EHR Systems (Epic)", t: 3, m: 1 },
      { s: "Project Coordination", t: 3, m: 0 },
      { s: "Data Analysis (Excel)", t: 3, m: 0 },
    ],
    scn: {
      name: "No-show spike",
      character: "Dr. Patel, the practice lead, frustrated by a 22% no-show rate",
      setting: "Monday operations huddle",
    },
  },
  {
    id: "hda",
    title: "Health Data Analyst",
    employer: "Biscayne Health Network",
    sector: "Healthcare",
    hood: "Health District",
    pay: [68, 82],
    tier: "mid",
    years: 2,
    lang: "",
    soft: ["communication", "problem_solving"],
    reqs: [
      { s: "SQL", t: 4, m: 1 },
      { s: "Data Analysis (Excel)", t: 4, m: 1 },
      { s: "Data Visualization (Tableau/Power BI)", t: 3, m: 1 },
      { s: "HIPAA Compliance", t: 3, m: 1 },
      { s: "Python", t: 3, m: 0 },
    ],
    scn: {
      name: "The readmissions question",
      character: "A VP of Nursing who needs a straight answer by Friday",
      setting: "Quick hallway meeting",
    },
  },
  {
    id: "csm",
    title: "Customer Success Manager",
    employer: "Palmetto Labs",
    sector: "Tech & fintech",
    hood: "Wynwood",
    pay: [70, 90],
    tier: "mid",
    years: 3,
    lang: "Spanish",
    soft: ["communication", "empathy", "problem_solving"],
    reqs: [
      { s: "Customer Success Management", t: 4, m: 1 },
      { s: "Service Recovery", t: 4, m: 1 },
      { s: "CRM (Salesforce/HubSpot)", t: 3, m: 1 },
      { s: "Data Analysis (Excel)", t: 3, m: 0 },
      { s: "AI Tools & Prompting", t: 2, m: 0 },
    ],
    scn: {
      name: "Renewal at risk",
      character: "Carla, ops director at a Doral distributor, threatening not to renew",
      setting: "Video call, 30 days before renewal",
    },
  },
  {
    id: "para",
    title: "Bilingual Paralegal",
    employer: "Ortega & Lane",
    sector: "Professional services",
    hood: "Brickell",
    pay: [55, 68],
    tier: "mid",
    years: 2,
    lang: "Spanish",
    soft: ["professionalism", "communication", "composure"],
    reqs: [
      { s: "Legal Research & Drafting", t: 4, m: 1 },
      { s: "Project Coordination", t: 3, m: 1 },
      { s: "Data Analysis (Excel)", t: 2, m: 0 },
    ],
    scn: {
      name: "Anxious client",
      character: "A small-business owner, nervous about a deposition tomorrow",
      setting: "Phone call, end of day",
    },
  },
  {
    id: "aiops",
    title: "AI Operations Analyst",
    employer: "Brickell Automation Group",
    sector: "Professional services",
    hood: "Brickell",
    pay: [75, 95],
    tier: "mid",
    years: 2,
    lang: "",
    soft: ["problem_solving", "communication"],
    reqs: [
      { s: "AI Tools & Prompting", t: 4, m: 1 },
      { s: "Process Improvement", t: 4, m: 1 },
      { s: "Data Analysis (Excel)", t: 3, m: 1 },
      { s: "Python", t: 3, m: 0 },
      { s: "Project Coordination", t: 3, m: 0 },
    ],
    scn: {
      name: "The skeptical team lead",
      character:
        "Marcus, an AP team lead who thinks the new AI invoice bot will cost his team jobs",
      setting: "Rollout kickoff meeting",
    },
  },
  {
    id: "imp",
    title: "Import/Export Coordinator",
    employer: "Port Gateway Logistics",
    sector: "Logistics & trade",
    hood: "Doral",
    pay: [45, 55],
    tier: "entry",
    years: 1,
    lang: "Spanish",
    soft: ["composure", "communication", "problem_solving"],
    reqs: [
      { s: "Customs & Trade Compliance", t: 3, m: 1 },
      { s: "Freight & Logistics Coordination", t: 3, m: 1 },
      { s: "Data Analysis (Excel)", t: 2, m: 0 },
      { s: "Project Coordination", t: 2, m: 0 },
    ],
    scn: {
      name: "Customs hold",
      character:
        "A Colombian flower importer whose container is held at PortMiami before Valentine's week",
      setting: "Phone call, 7 a.m.",
    },
  },
  {
    id: "sca",
    title: "Supply Chain Analyst",
    employer: "Medley Distribution Co.",
    sector: "Logistics & trade",
    hood: "Medley",
    pay: [62, 75],
    tier: "mid",
    years: 2,
    lang: "",
    soft: ["problem_solving", "communication"],
    reqs: [
      { s: "Supply Chain Planning", t: 4, m: 1 },
      { s: "Data Analysis (Excel)", t: 4, m: 1 },
      { s: "SQL", t: 3, m: 0 },
      { s: "Freight & Logistics Coordination", t: 3, m: 0 },
    ],
    scn: {
      name: "Hurricane prep",
      character: "The warehouse GM asking how much stock to pull forward before a storm",
      setting: "Ops war room, storm 4 days out",
    },
  },
  {
    id: "ops",
    title: "Operations Lead, Last-Mile Delivery",
    employer: "Hialeah Express",
    sector: "Logistics & trade",
    hood: "Hialeah",
    pay: [65, 78],
    tier: "lead",
    years: 4,
    lang: "Spanish",
    soft: ["composure", "communication", "professionalism", "problem_solving"],
    reqs: [
      { s: "Freight & Logistics Coordination", t: 4, m: 1 },
      { s: "Process Improvement", t: 5, m: 1 },
      { s: "Project Coordination", t: 4, m: 1 },
      { s: "Data Analysis (Excel)", t: 3, m: 0 },
    ],
    scn: {
      name: "Driver walkout",
      character: "Luis, a senior driver speaking for six drivers upset about new routes",
      setting: "Dispatch yard, 5:30 a.m.",
    },
  },
  {
    id: "gem",
    title: "Guest Experience Manager",
    employer: "Ocean Drive Collection",
    sector: "Hospitality",
    hood: "Miami Beach",
    pay: [58, 70],
    tier: "mid",
    years: 3,
    lang: "Spanish",
    soft: ["empathy", "composure", "professionalism", "communication"],
    reqs: [
      { s: "Hospitality Operations", t: 4, m: 1 },
      { s: "Service Recovery", t: 4, m: 1 },
      { s: "Project Coordination", t: 3, m: 0 },
      { s: "CRM (Salesforce/HubSpot)", t: 2, m: 0 },
    ],
    scn: {
      name: "Overbooked on Art Basel weekend",
      character: "A VIP guest whose suite was given away, arriving at midnight",
      setting: "Hotel lobby, Art Basel Saturday",
    },
  },
  {
    id: "rev",
    title: "Revenue Manager",
    employer: "Key Biscayne Resorts",
    sector: "Hospitality",
    hood: "Key Biscayne",
    pay: [72, 88],
    tier: "mid",
    years: 3,
    lang: "",
    soft: ["problem_solving", "communication"],
    reqs: [
      { s: "Revenue Management", t: 4, m: 1 },
      { s: "Data Analysis (Excel)", t: 4, m: 1 },
      { s: "Data Visualization (Tableau/Power BI)", t: 3, m: 0 },
      { s: "Hospitality Operations", t: 3, m: 0 },
    ],
    scn: {
      name: "Rate fight",
      character: "The GM who wants to drop rates 20% for a slow September",
      setting: "Weekly revenue meeting",
    },
  },
  {
    id: "jda",
    title: "Junior Data Analyst",
    employer: "Magic City Fintech",
    sector: "Tech & fintech",
    hood: "Brickell",
    pay: [58, 70],
    tier: "entry",
    years: 0,
    lang: "",
    soft: ["communication", "problem_solving"],
    reqs: [
      { s: "SQL", t: 3, m: 1 },
      { s: "Data Analysis (Excel)", t: 3, m: 1 },
      { s: "Data Visualization (Tableau/Power BI)", t: 3, m: 1 },
      { s: "Python", t: 2, m: 0 },
    ],
    scn: {
      name: "Numbers don't match",
      character: "A product manager whose dashboard disagrees with your report",
      setting: "Slack huddle",
    },
  },
  {
    id: "soc",
    title: "SOC Analyst I",
    employer: "Southeast Cyber Defense",
    sector: "Tech & fintech",
    hood: "Doral",
    pay: [60, 74],
    tier: "entry",
    years: 1,
    lang: "",
    soft: ["composure", "problem_solving", "communication"],
    reqs: [
      { s: "Security Monitoring (SIEM)", t: 3, m: 1 },
      { s: "Incident Response", t: 3, m: 1 },
      { s: "Python", t: 2, m: 0 },
      { s: "Process Improvement", t: 2, m: 0 },
    ],
    scn: {
      name: "Phishing at 2 a.m.",
      character: "A panicked client office manager who clicked a link",
      setting: "Overnight shift hotline",
    },
  },
  {
    id: "fcc",
    title: "Fintech Compliance Analyst",
    employer: "Calle Pay",
    sector: "Tech & fintech",
    hood: "Brickell",
    pay: [68, 85],
    tier: "mid",
    years: 2,
    lang: "Spanish",
    soft: ["professionalism", "problem_solving"],
    reqs: [
      { s: "AML/KYC Compliance", t: 4, m: 1 },
      { s: "Data Analysis (Excel)", t: 3, m: 1 },
      { s: "Process Improvement", t: 3, m: 0 },
      { s: "Legal Research & Drafting", t: 2, m: 0 },
    ],
    scn: {
      name: "Flagged remittances",
      character: "A long-time merchant customer angry their account is frozen for review",
      setting: "Escalation call",
    },
  },
] as Job[];
export const SAMPLE_PROFILE: Profile = {
  name: "Daniela Reyes",
  headline: "Front Desk Supervisor, hospitality",
  years: 5,
  languages: ["English", "Spanish"],
  skills: {
    "Hospitality Operations": {
      level: 4,
      evidence: "Manage reservations and room assignments in Opera PMS during peak events",
    },
    "Service Recovery": {
      level: 4,
      evidence: "Resolve escalated guest complaints and turn them into return stays",
    },
    "Scheduling & Patient Flow": { level: 3, evidence: "build weekly shift schedules" },
    "Project Coordination": {
      level: 2,
      evidence: "Coordinated room moves with housekeeping and maintenance",
    },
    "Data Analysis (Excel)": {
      level: 2,
      evidence: "Track weekly occupancy and upgrade revenue in Excel",
    },
    "CRM (Salesforce/HubSpot)": {
      level: 2,
      evidence: "Logged guest preferences in HubSpot for repeat visitors",
    },
    "Revenue Management": { level: 2, evidence: "Track weekly occupancy and upgrade revenue" },
    "Customer Success Management": { level: 2, evidence: "turn them into return stays" },
  },
};
/** The profile before any resume is analyzed. */
export const EMPTY_PROFILE: Profile = {
  name: "",
  headline: "",
  years: 0,
  languages: [],
  skills: {},
};
export const SAMPLE_RESUME =
  "DANIELA REYES\nMiami, FL \u00b7 Bilingual English / Spanish\n\nEXPERIENCE\nFront Desk Supervisor, The Palms Brickell Hotel (2021 to present)\n- Supervise a front desk team of 6 across three shifts; build weekly shift schedules\n- Resolve escalated guest complaints and turn them into return stays (guest satisfaction up from 84 to 91)\n- Manage reservations and room assignments in Opera PMS during peak events like Art Basel and Miami Open\n- Track weekly occupancy and upgrade revenue in Excel and report to the GM\n- Train new hires on check-in standards and service recovery\n\nGuest Services Agent, Seabreeze Resort, Miami Beach (2019 to 2021)\n- Handled 150+ check-ins a day in English and Spanish\n- Logged guest preferences in HubSpot for repeat visitors\n- Coordinated room moves with housekeeping and maintenance\n\nEDUCATION\nA.A. Business Administration, Miami Dade College\n\nSKILLS\nExcel (pivot tables), Opera PMS, HubSpot (basic), conflict resolution, team scheduling";
export type SoftKey =
  "communication" | "empathy" | "problem_solving" | "composure" | "professionalism";
export type Profile = {
  name: string;
  headline: string;
  years: number;
  languages: string[];
  skills: Record<string, { level: number; evidence: string }>;
};
export type Job = {
  id: string;
  title: string;
  employer: string;
  sector: string;
  hood: string;
  pay: [number, number];
  tier: "entry" | "mid" | "lead";
  years: number;
  lang: string;
  soft: SoftKey[];
  reqs: { s: string; t: number; m: number }[];
  scn: { name: string; character: string; setting: string };
};
export type Evidence = {
  skill: string;
  job: string;
  level: number;
  confidence: number;
  quote: string;
  at: string;
  session: string;
};
export type Turn = {
  role: "user" | "assistant";
  text: string;
  level?: number | undefined;
  confidence?: number | undefined;
};
export type Simulation = {
  job: string;
  scores: Record<SoftKey, number>;
  summary: string;
  quote: string;
  tips: string[];
  turns: Turn[];
  at: string;
};
export const BLOOM = [
  "Not yet",
  "Remember",
  "Understand",
  "Apply",
  "Analyze",
  "Evaluate",
  "Create",
];
export const SOFT: SoftKey[] = [
  "communication",
  "empathy",
  "problem_solving",
  "composure",
  "professionalism",
];

export function getJob(id: string): Job {
  const job = JOBS.find((j) => j.id === id) ?? JOBS.find((j) => j.id === "gem");
  if (!job) throw new Error("Sample jobs unavailable");
  return job;
}
