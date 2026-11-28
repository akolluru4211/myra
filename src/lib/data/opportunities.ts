export type OpportunityCategory = "hackathons" | "internships" | "jobs";

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  location: string;
  url: string;
  deadline?: string;
  source?: "Unstop" | "Greenhouse" | "Ashby";
  employmentType?: "internship" | "job";
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
    id: "unstop-1827472",
    title: "Finance Next Hackathon 2026",
    organization: "Proton Solutions",
    location: "Online",
    url: "https://unstop.com/hackathons/finance-next-hackathon-2026-proton-solutions-1827472",
    deadline: "2026-12-30T18:30:00Z",
    source: "Unstop",
  },
  {
    id: "unstop-1799091",
    title: "Hacksmart 2.0",
    organization: "Battery Smart and Geek Room",
    location: "Gurugram, India",
    url: "https://unstop.com/hackathons/hacksmart-20-geek-room-1799091",
    deadline: "2026-12-15T18:29:00Z",
    source: "Unstop",
    summary: "Build solutions for electric mobility and battery swapping. Finale dates are to be announced.",
    teamSize: "1–4 participants",
  },
  {
    id: "unstop-1818968",
    title: "Campus to Cloud Hackathon",
    organization: "IIT Bombay Techfest and AWS",
    location: "Hybrid · Mumbai, India",
    url: "https://unstop.com/hackathons/campus-to-cloud-hackathon-iit-bombay-1818968",
    deadline: "2026-11-30T00:00:00+05:30",
    source: "Unstop",
    summary: "Build and deploy a solution on AWS. Shortlisted teams present at IIT Bombay.",
    eligibility: "Students aged 18+ enrolled in Indian institutions",
    teamSize: "1–4 participants",
    prize: "₹1,50,000 prize pool",
  },
  {
    id: "unstop-1826867",
    title: "UNIVION: CHRONOS DE NOVO",
    organization: "SIEEDS Foundation",
    location: "Hybrid · New Delhi, India",
    url: "https://unstop.com/hackathons/univion-chronos-de-novo-sieeds-1826867",
    deadline: "2026-12-26T00:00:00+05:30",
    source: "Unstop",
    summary: "Submit an idea online for a chance to attend the January 15–16 finale at IIT Delhi.",
    eligibility: "Undergraduate and postgraduate students in India",
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

const listedRoles: (Opportunity & { deadline: string })[] = [
  {
    id: "unstop-1818776",
    title: "Software Intern",
    organization: "The Entrepreneurship Network",
    location: "Remote",
    url: "https://unstop.com/internships/software-internship-the-entrepreneurship-network-1818776",
    deadline: "2026-12-03T00:00:00+05:30",
    source: "Unstop",
    summary: "Three-month, part-time software internship for freshers.",
    employmentType: "internship",
  },
  {
    id: "unstop-1822585",
    title: "Full Stack Developer Intern",
    organization: "Vortizo AI",
    location: "Remote",
    url: "https://unstop.com/internships/full-stack-developer-internship-vortizo-ai-1822585",
    deadline: "2026-12-05T00:00:00+05:30",
    source: "Unstop",
    summary: "Full-time web development internship open to students and freshers with relevant skills.",
    employmentType: "internship",
  },
  {
    id: "unstop-1825287",
    title: "React Native App Development Intern",
    organization: "Digital Dictionary",
    location: "Remote",
    url: "https://unstop.com/internships/react-native-app-development-internship-digital-dictionary-1825287",
    deadline: "2026-12-07T00:00:00+05:30",
    source: "Unstop",
    summary: "Three-month, full-time internship with a published fixed stipend of ₹5,000 per month.",
    employmentType: "internship",
  },
  {
    id: "unstop-1828400",
    title: "Full Stack Developer Intern",
    organization: "Aeromedia",
    location: "Remote",
    url: "https://unstop.com/internships/full-stack-developer-internship-aeromedia-1828400",
    deadline: "2026-12-09T00:00:00+05:30",
    source: "Unstop",
    summary: "Three-month, full-time unpaid internship for students graduating in 2028 or later.",
    employmentType: "internship",
  },
  {
    id: "unstop-1803899",
    title: "Web Development Intern",
    organization: "Codeatrix",
    location: "Remote",
    url: "https://unstop.com/internships/web-development-internship-codeatrix-1803899",
    deadline: "2026-12-10T12:43:00+05:30",
    source: "Unstop",
    summary: "Full-time web development internship for students and recent graduates.",
    employmentType: "internship",
  },
  {
    id: "unstop-1823006",
    title: "Associate Software Engineer",
    organization: "Hevo Data",
    location: "Bengaluru, India",
    url: "https://unstop.com/jobs/associate-software-engineer-hevo-data-1823006",
    deadline: "2026-12-06T00:00:00+05:30",
    source: "Unstop",
    summary: "Full-time, in-office software role involving API development and testing.",
    employmentType: "job",
  },
  {
    id: "unstop-1826300",
    title: "Software Engineer, Digital Applications",
    organization: "Emerson",
    location: "Chennai, India · Hybrid",
    url: "https://unstop.com/jobs/software-engineer-digital-applications-emerson-1826300",
    deadline: "2026-12-08T00:00:00+05:30",
    source: "Unstop",
    summary: "Full-time software development role on Emerson’s digital applications team.",
    employmentType: "job",
  },
];

export function getOpenUnstopRoles() {
  const now = Date.now();
  return listedRoles.filter(({ deadline }) => Date.parse(deadline) > now);
}

export function getOpenHackathons() {
  const now = Date.now();
  const closingTime = (deadline: string) => Date.parse(
    deadline.length === 10 ? deadline + "T23:59:59Z" : deadline,
  );
  return hackathons
    .filter(({ deadline }) => closingTime(deadline) > now)
    .sort((a, b) => closingTime(a.deadline) - closingTime(b.deadline));
}
