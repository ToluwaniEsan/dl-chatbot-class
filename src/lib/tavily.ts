/**
 * Tavily web search integration for current information lookup.
 * Free tier: 1,000 API calls/month at tavily.com
 */

export type TavilySearchResult = {
  query: string;
  searchResults: Array<{
    title: string;
    url: string;
    content: string;
  }>;
};

export async function searchWeb(query: string): Promise<TavilySearchResult | null> {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    // Silently skip if no key configured
    return null;
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        include_answer: true,
        max_results: 5,
      }),
    });

    if (!response.ok) {
      console.error(`Tavily API error: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      results?: Array<{
        title: string;
        url: string;
        content: string;
      }>;
    };

    return {
      query,
      searchResults: data.results || [],
    };
  } catch (error) {
    console.error("Tavily search failed:", error);
    return null;
  }
}

export function buildSearchContextPrompt(
  basePrompt: string,
  searchResult: TavilySearchResult,
): string {
  const context = searchResult.searchResults
    .map((r, i) => `[${i + 1}] **${r.title}**\nSource: ${r.url}\n${r.content}`)
    .join("\n\n");

  return `${basePrompt}

## Web Search Results for: "${searchResult.query}"
${context}

Use the above web search results to provide current, accurate information. Do not include source lists or URLs in the final answer unless the user explicitly asks for them.`;
}
