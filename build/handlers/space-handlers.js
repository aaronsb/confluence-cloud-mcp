import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
export async function handleListSpaces(client, args) {
    try {
        const spaces = await client.getSpaces(args);
        // Transform to minimal format
        const simplified = {
            results: spaces.results.map(space => ({
                id: space.id,
                name: space.name,
                key: space.key,
                status: space.status
            })),
            next: spaces._links.next ? true : false
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(simplified),
                },
            ],
        };
    }
    catch (error) {
        console.error("Error listing spaces:", error);
        throw new McpError(ErrorCode.InternalError, `Failed to list spaces: ${error instanceof Error ? error.message : String(error)}`);
    }
}
export async function handleGetSpace(client, args) {
    try {
        if (!args.spaceId) {
            throw new McpError(ErrorCode.InvalidParams, "spaceId is required");
        }
        const space = await client.getSpace(args.spaceId);
        // Transform to minimal format
        const simplified = {
            id: space.id,
            name: space.name,
            key: space.key,
            status: space.status,
            homepage: space.homepageId,
            url: space._links.webui
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(simplified),
                },
            ],
        };
    }
    catch (error) {
        console.error("Error getting space:", error);
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Failed to get space: ${error instanceof Error ? error.message : String(error)}`);
    }
}
