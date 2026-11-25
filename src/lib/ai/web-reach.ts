import { validateExternalLookupUrl } from "./link-validator.ts";

/**
 * Web & Repository Reach Engine for Myra AI
 * Resolves URLs and live web search ONLY when explicitly opted-in by the user.
 * Sends only the search terms or validated public URL needed for the lookup.
 * Conversation history, student profiles, and cognitive memory are strictly excluded.
 */

export interface WebReachResult {
  url: string;
  sourceType: "github_repo" | "web_article" | "documentation" | "web_search";
  title?: string;
  snippet?: string;
  content: string;
  isExtracted: boolean;
}

export interface WebReachOptions {
  enabled?: boolean;
}

/**
 * Extract all HTTP/HTTPS URLs from a text prompt.
 */
export function extractUrlsFromText(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = text.match(urlRegex);
  if (!matches) return [];
  // Strip trailing punctuation like period, comma, closing parenthesis
  return matches.map((url) => url.replace(/[),.;!]+$/, ""));
}

/**
 * Parse a GitHub URL to extract owner and repository name.
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2].replace(/\.git$/i, "");
  return { owner, repo };
}

/**
 * Fetch raw README or code content for a GitHub repository.
 */
async function fetchGitHubRepoDetails(owner: string, repo: string): Promise<string | null> {
  const branches = ["main", "master"];
  for (const branch of branches) {
    try {
      const readmeUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/README.md`;
      const res = await fetch(readmeUrl, {
        headers: { "User-Agent": "EdworldCo-Myra-Tutor" },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 20) {
          if (text.includes("README_en.md")) {
            try {
              const enRes = await fetch(
                `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/docs/README_en.md`,
                { signal: AbortSignal.timeout(4000) }
              );
              if (enRes.ok) {
                const enText = await enRes.text();
                return `Repository: ${owner}/${repo}\n\n${enText}\n\n[Original README snippet]:\n${text.slice(0, 1000)}`;
              }
            } catch (e) {}
          }
          return `Repository: ${owner}/${repo}\n\n${text.slice(0, 10000)}`;
        }
      }
    } catch (e) {
      // Continue to next branch
    }
  }
  return null;
}

/**
 * Fetch live content using Jina Reader (https://r.jina.ai/{url})
 * Only sends validated HTTPS external URLs.
 */
async function fetchViaJinaReader(url: string): Promise<string | null> {
  const validated = validateExternalLookupUrl(url);
  if (!validated) return null;

  try {
    const jinaUrl = `https://r.jina.ai/${validated}`;
    const res = await fetch(jinaUrl, {
      headers: {
        "User-Agent": "EdworldCo-Myra-Tutor",
        "Accept": "text/markdown",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const markdown = await res.text();
      return markdown.slice(0, 8000);
    }
  } catch (e) {
    // Ignore and fallback
  }
  return null;
}

/**
 * Execute live web search using Jina Search API (https://s.jina.ai/{query})
 * Sends ONLY sanitized query search terms, no profile, history, or memory.
 */
async function searchWebQuery(query: string): Promise<string | null> {
  try {
    const cleanQuery = query
      .replace(/^(search|lookup|find|browse|google|tell me about|what is|how to)\s+/i, "")
      .trim()
      .slice(0, 300); // Limit query length

    if (!cleanQuery) return null;

    const searchUrl = `https://s.jina.ai/${encodeURIComponent(cleanQuery)}`;
    const res = await fetch(searchUrl, {
      headers: {
        "User-Agent": "EdworldCo-Myra-Tutor",
        "Accept": "text/markdown",
      },
      signal: AbortSignal.timeout(6500),
    });

    if (res.ok) {
      const searchMarkdown = await res.text();
      if (searchMarkdown && searchMarkdown.length > 50) {
        return searchMarkdown.slice(0, 6000);
      }
    }
  } catch (e) {
    // Graceful fallback
  }
  return null;
}

/**
 * Main Web Reach resolver:
 * Requires explicit opt-in (enabled: true).
 * When enabled is false or omitted (default), returns null immediately.
 * Pasted URLs or words like "latest" / "news" do NOT trigger external lookup unless enabled=true.
 */
export async function resolveWebReach(
  query: string,
  options: WebReachOptions = {}
): Promise<WebReachResult | null> {
  // Explicit opt-in gate: Off by default
  if (!options.enabled) {
    return null;
  }

  // 1. Check if user provided direct URLs
  const urls = extractUrlsFromText(query);
  if (urls.length > 0) {
    const rawTarget = urls[0];
    const validatedTarget = validateExternalLookupUrl(rawTarget);

    if (validatedTarget) {
      const github = parseGitHubUrl(validatedTarget);

      if (github) {
        const repoContent = await fetchGitHubRepoDetails(github.owner, github.repo);
        if (repoContent) {
          return {
            url: validatedTarget,
            sourceType: "github_repo",
            title: `${github.owner}/${github.repo} (GitHub)`,
            snippet: repoContent.slice(0, 200).replace(/\n+/g, " "),
            content: repoContent,
            isExtracted: true,
          };
        }
      }

      // Fetch general HTTPS URLs via reader
      const jinaContent = await fetchViaJinaReader(validatedTarget);
      if (jinaContent) {
        return {
          url: validatedTarget,
          sourceType: "web_article",
          title: validatedTarget,
          snippet: jinaContent.slice(0, 200).replace(/\n+/g, " "),
          content: jinaContent,
          isExtracted: true,
        };
      }
    }
  }

  // 2. Perform live web search for clean query terms
  const searchResults = await searchWebQuery(query);
  if (searchResults) {
    const searchCitationUrl = "https://google.com/search?q=" + encodeURIComponent(query.slice(0, 100));
    return {
      url: searchCitationUrl,
      sourceType: "web_search",
      title: `Live Search: "${query.slice(0, 40)}"`,
      snippet: searchResults.slice(0, 200).replace(/\n+/g, " "),
      content: searchResults,
      isExtracted: true,
    };
  }

  return null;
}
