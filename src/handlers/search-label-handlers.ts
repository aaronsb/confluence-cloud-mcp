import { ConfluenceClient } from "../client/confluence-client.js";
import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
import type { Label, SearchResult } from "../types/index.js";

export async function handleSearchContent(
  client: ConfluenceClient,
  args: {
    cql: string;
    limit?: number;
    cursor?: string;
  }
): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  try {
    if (!args.cql) {
      throw new McpError(ErrorCode.InvalidParams, "cql is required");
    }

    const results = await client.searchContentV1(args.cql, {
      limit: args.limit,
      start: args.cursor ? parseInt(args.cursor, 10) : 0
    });
    const simplified = {
      results: results.results.map(result => ({
        id: result.content.id,
        title: result.content.title,
        spaceId: result.content.space.id,
        spaceKey: result.content.space.key,
        version: result.content.version,
        url: result.content._links.webui
      })),
      next: results._links.next ? true : false
    };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(simplified),
        },
      ],
    };
  } catch (error) {
    console.error("Error searching content:", error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to search content: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function handleGetLabels(
  client: ConfluenceClient,
  args: { pageId: string }
): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  try {
    if (!args.pageId) {
      throw new McpError(ErrorCode.InvalidParams, "pageId is required");
    }

    const labels = await client.getLabels(args.pageId);
    const simplified = {
      labels: labels.results.map((label: Label) => ({
        id: label.id,
        name: label.name
      })),
      next: labels._links.next ? true : false
    };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(simplified),
        },
      ],
    };
  } catch (error) {
    console.error("Error getting labels:", error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to get labels: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function handleAddLabel(
  client: ConfluenceClient,
  args: { contentId: string; prefix: string; name: string }
): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  try {
    if (!args.contentId || !args.prefix || !args.name) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "contentId, prefix, and name are required"
      );
    }

    if (args.prefix !== "global") {
      throw new McpError(
        ErrorCode.InvalidParams,
        "prefix must be 'global'"
      );
    }

    const label = await client.addLabel(args.contentId, args.prefix, args.name);
    const simplified = {
      success: true,
      id: label.id,
      name: label.name
    };
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(simplified),
        },
      ],
    };
  } catch (error) {
    console.error("Error adding label:", error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to add label: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function handleRemoveLabel(
  client: ConfluenceClient,
  args: { pageId: string; label: string }
): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  try {
    if (!args.pageId || !args.label) {
      throw new McpError(
        ErrorCode.InvalidParams,
        "pageId and label are required"
      );
    }

    await client.removeLabel(args.pageId, args.label);
    return {
      content: [
        {
          type: "text",
          text: `Successfully removed label '${args.label}' from page ${args.pageId}`,
        },
      ],
    };
  } catch (error) {
    console.error("Error removing label:", error);
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to remove label: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
