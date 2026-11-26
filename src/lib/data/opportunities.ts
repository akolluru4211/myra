export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  location: string;
  url: string;
  deadline?: string;
  source?: "Unstop";
  summary?: string;
  eligibility?: string;
  teamSize?: string;
  prize?: string;
}

export const hackathonDirectories = [
  { name: "Unstop", url: "https://unstop.com/hackathons" },
  { name: "Devpost", url: "https://devpost.com/hackathons/" },
  { name: "Devfolio", url: "https://devfolio.co/explore" },
  { name: "Major League Hacking", url: "https://mlh.io/seasons/2027/events" },
];

const hackathons: (Opportunity & { deadline: string })[] = [
  {
    id: "unstop-1773675",
    title: "StarForge",
    organization: "BMS Institute of Technology & Management",
    location: "Bengaluru, India",
    url: "https://unstop.com/o/1773675",
    deadline: "2026-11-27T23:59:00+05:30",
    source: "Unstop",
    summary: "A 24-hour national hackathon on December 12–13.",
  },
  {
    id: "unstop-1806016",
    title: "Incursion 2027",
    organization: "Dr. D. Y. Patil Institute of Technology",
    location: "Hybrid · India",
    url: "https://unstop.com/hackathons/incursion-2027-24-hour-national-level-hackathon-dr-dy-patil-institute-of-technology-1806016",
    deadline: "2026-12-05T23:59:59+05:30",
    source: "Unstop",
    summary: "Online selection rounds lead to a 24-hour finale. Registration is free. Finalists should check the event page for the confirmation fee.",
    eligibility: "Undergraduate and postgraduate students",
    teamSize: "2–4 participants",
  },
  {
    id: "unstop-1820868",
    title: "SVPCET Hackathon",
    organization: "St. Vincent Pallotti College of Engineering and Technology",
    location: "Nagpur, India",
    url: "https://unstop.com/hackathons/hackathon-st-vincent-pallotti-college-of-engineering-and-technology-svpcet-nagpur-1820868",
    deadline: "2026-12-11T00:00:00+05:30",
    source: "Unstop",
    summary: "The top 50 shortlisted teams take part in a 24-hour campus finale on December 19–20.",
    eligibility: "Undergraduate students in India",
  },
  {
    id: "unstop-1828497",
    title: "Snow Code",
    organization: "STAMPERS",
    location: "Online",
    url: "https://unstop.com/hackathons/snow-code-stampers-1828497",
    deadline: "2026-12-11T00:00:00+05:30",
    source: "Unstop",
    summary: "A 24-hour online coding event on December 12–13.",
    teamSize: "1–4 participants",
    prize: "₹3,000 first prize",
  },
  {
    id: "unstop-1814814",
    title: "BUILDFEST 2026",
    organization: "Learnix Labs",
    location: "Online · India",
    url: "https://unstop.com/hackathons/buildfest-2026-learnix-labs-1814814",
    deadline: "2026-12-15T00:00:00+05:30",
    source: "Unstop",
    summary: "Build or showcase an original project in AI, software development, data science, or another technology domain.",
    eligibility: "Undergraduate and postgraduate students",
    teamSize: "Individual participation",
  },
  {
    id: "unstop-1821473",
    title: "OpenVerse ’26",
    organization: "CampusCode",
    location: "Online · India",
    url: "https://unstop.com/hackathons/openverse-26-campus-code-1821473",
    deadline: "2026-12-24T23:59:00+05:30",
    source: "Unstop",
    summary: "An open-innovation hackathon with idea, prototype, and demo rounds on the CampusCode portal.",
    eligibility: "Undergraduate and postgraduate students across disciplines",
    teamSize: "1–4 participants",
    prize: "₹5,000 first prize",
  },
  {
    id: "reddit-game-of-the-day-2026",
    title: "Reddit’s Game of the Day Hackathon",
    organization: "Reddit",
    location: "Online",
    url: "https://redditgameofday2026.devpost.com/",
    deadline: "2026-12-09T02:00:00Z",
  },
  {
    id: "qnx-global-2026",
    title: "QNX Global Hackathon",
    organization: "QNX",
    location: "Online",
    url: "https://qnx.devpost.com/",
    deadline: "2026-12-15T19:00:00Z",
  },
  {
    id: "codegeist-2026",
    title: "Codegeist 2026",
    organization: "Atlassian",
    location: "Online",
    url: "https://codegeist2026.devpost.com/",
    deadline: "2026-12-22T20:00:00Z",
  },
  {
    id: "hack-canada-2027",
    title: "Hack Canada 2027",
    organization: "Hack Canada",
    location: "Toronto, Canada",
    url: "https://app.hackcanada.org/",
    deadline: "2026-12-31",
  },
  {
    id: "techacks-5",
    title: "TecHacks 5.0",
    organization: "Chitkara University",
    location: "Rajpura, India",
    url: "https://techacks05.devfolio.co/",
    deadline: "2027-01-10",
  },
];

export function getOpenHackathons() {
  const now = Date.now();
  const closingTime = (deadline: string) => Date.parse(
    deadline.length === 10 ? deadline + "T23:59:59Z" : deadline,
  );
  return hackathons
    .filter(({ deadline }) => closingTime(deadline) > now)
    .sort((a, b) => closingTime(a.deadline) - closingTime(b.deadline));
}
