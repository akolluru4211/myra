export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  location: string;
  url: string;
  deadline?: string;
}

export const hackathonDirectories = [
  { name: "Devpost", url: "https://devpost.com/hackathons/" },
  { name: "Devfolio", url: "https://devfolio.co/explore" },
  { name: "Major League Hacking", url: "https://mlh.io/seasons/2027/events" },
];

const hackathons: Opportunity[] = [
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
  return hackathons.filter(({ deadline }) => {
    if (!deadline) return false;
    const deadlineTime = Date.parse(deadline.length === 10 ? deadline + "T23:59:59Z" : deadline);
    return deadlineTime > now;
  });
}
