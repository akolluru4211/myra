export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  url: string;
  license: string;
  canStorePdf: boolean;
  pdfUrl?: string;
  courseSlugs: string[];
  topics: string[];
  whatYouCanLearn: string;
  abstract: string;
  keySections: Array<{
    page: number;
    sectionTitle: string;
    summary: string;
  }>;
}

export const EDLEARN_RESEARCH_PAPERS: ResearchPaper[] = [
  {
    id: "paper-chandy-lamport-1985",
    title: "Distributed Snapshots: Determining Global States of Distributed Systems",
    authors: ["K. Mani Chandy", "Leslie Lamport"],
    year: 1985,
    venue: "ACM Transactions on Computer Systems (TOCS)",
    url: "https://dl.acm.org/doi/10.1145/214451.214456",
    license: "ACM Author-Izer / Open Bibliographic Access",
    canStorePdf: false,
    courseSlugs: ["dsa"],
    topics: ["Distributed Systems", "Graph Traversal", "State Synchronization", "Algorithms"],
    whatYouCanLearn: "How asynchronous marker messages capture consistent global state in distributed networks without stopping local processes. Connects directly to graph traversal and consistency.",
    abstract: "This paper presents an algorithm by which a process in a distributed graph system can determine a global state of the system during a computation without freezing activity.",
    keySections: [
      {
        page: 2,
        sectionTitle: "1. The System Model",
        summary: "Models a distributed system as a directed graph where vertices are processes and edges are unidirectional FIFO message channels."
      },
      {
        page: 4,
        sectionTitle: "2. The Marker Sending & Receiving Rules",
        summary: "Defines the fundamental protocol: on recording its state, a process sends a marker along each outgoing channel before sending further messages."
      }
    ]
  },
  {
    id: "paper-codd-1970-relational-model",
    title: "A Relational Model of Data for Large Shared Data Banks",
    authors: ["Edgar F. Codd"],
    year: 1970,
    venue: "Communications of the ACM (CACM)",
    url: "https://dl.acm.org/doi/10.1145/362384.362685",
    license: "ACM Classic Paper Access",
    canStorePdf: false,
    courseSlugs: ["sql"],
    topics: ["Relational Algebra", "Database Normalization", "Query Projections", "SQL Foundations"],
    whatYouCanLearn: "The foundational theoretical paper that invented relational tables, primary keys, projections, and joins, replacing hierarchical network pointer chains.",
    abstract: "Future users of large data banks must be protected from having to know how the data is organized in the machine. A model based on n-ary relations is formulated.",
    keySections: [
      {
        page: 377,
        sectionTitle: "1. Relational View of Data",
        summary: "Introduces relations as sets of tuples and distinguishes logical schema independence from physical storage mechanisms."
      },
      {
        page: 382,
        sectionTitle: "2. Operations on Relations",
        summary: "Formalizes relational operators: projection, join, restriction, and division which form modern SQL query semantics."
      }
    ]
  },
  {
    id: "paper-kahneman-tversky-1979-prospect-theory",
    title: "Prospect Theory: An Analysis of Decision under Risk",
    authors: ["Daniel Kahneman", "Amos Tversky"],
    year: 1979,
    venue: "Econometrica",
    url: "https://www.jstor.org/stable/1914185",
    license: "Open Access Scholarly Repository (Econometric Society)",
    canStorePdf: false,
    courseSlugs: ["aptitude"],
    topics: ["Cognitive Biases", "Probability Judgment", "Risk-Averse Reasoning", "Aptitude Error Diagnosis"],
    whatYouCanLearn: "Why humans systematically miscalculate probabilities in quantitative tests and why loss aversion causes predictable mistake patterns in timed competitive exams.",
    abstract: "This paper presents a critique of expected utility theory as a descriptive model of decision making under risk, and develops an alternative model called Prospect Theory.",
    keySections: [
      {
        page: 265,
        sectionTitle: "1. Critique of Expected Utility",
        summary: "Demonstrates certainty effect and reflection effect where people overweight low probabilities and underweight moderate ones."
      },
      {
        page: 279,
        sectionTitle: "2. The Weighting Function",
        summary: "Mathematical formulation showing that decision weights systematically distort objective probability values."
      }
    ]
  },
  {
    id: "paper-page-brin-1998-pagerank",
    title: "The Anatomy of a Large-Scale Hypertextual Web Search Engine",
    authors: ["Sergey Brin", "Lawrence Page"],
    year: 1998,
    venue: "Computer Networks and ISDN Systems (Stanford InfoLab)",
    url: "http://infolab.stanford.edu/pub/papers/google.pdf",
    license: "Stanford Public Technical Report (Authorized Open Repository)",
    canStorePdf: true,
    pdfUrl: "http://infolab.stanford.edu/pub/papers/google.pdf",
    courseSlugs: ["dsa", "sql"],
    topics: ["Graph Algorithms", "Eigenvector Centrality", "Inverted Indexing", "Search Systems"],
    whatYouCanLearn: "How web link topology is modeled as a stationary Markov chain random walk, and how inverted index tables enable sub-second keyword lookups over billions of documents.",
    abstract: "In this paper, we present Google, a prototype of a large-scale search engine which makes heavy use of the structure present in hypertext.",
    keySections: [
      {
        page: 3,
        sectionTitle: "2.1 PageRank: Bringing Order to the Web",
        summary: "PageRank PR(A) = (1-d) + d (PR(T1)/C(T1) + ... + PR(Tn)/C(Tn)). Models page importance as a probability distribution of random web surfers."
      },
      {
        page: 6,
        sectionTitle: "3. System Architecture & Inverted Index",
        summary: "Explains forward barrels, doc index tables, and lexicon maps for real-time word occurrence lookup."
      }
    ]
  }
];
