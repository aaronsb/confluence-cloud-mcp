import { McpError, ErrorCode } from "@modelcontextprotocol/sdk/types.js";
export async function handleListPages(client, args) {
    try {
        if (!args.spaceId) {
            throw new McpError(ErrorCode.InvalidParams, "spaceId is required");
        }
        const pages = await client.getPages(args.spaceId, {
            limit: args.limit,
            cursor: args.cursor,
            sort: args.sort,
            status: args.status
        });
        const simplified = {
            results: pages.results.map(page => ({
                id: page.id,
                title: page.title,
                spaceId: page.spaceId,
                version: page.version.number,
                parentId: page.parentId || null,
                status: page.status.value,
                _links: page._links
            })),
            cursor: pages._links.next?.split('cursor=')[1],
            limit: pages.limit,
            size: pages.size,
            hasMore: !!pages._links.next
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(simplified, null, 2),
                },
            ],
        };
    }
    catch (error) {
        console.error("Error listing pages:", error);
        throw new McpError(ErrorCode.InternalError, `Failed to list pages: ${error instanceof Error ? error.message : String(error)}`);
    }
}
export async function handleGetPage(client, args) {
    try {
        if (!args.pageId) {
            throw new McpError(ErrorCode.InvalidParams, "pageId is required");
        }
        const page = await client.getPage(args.pageId);
        const simplified = {
            id: page.id,
            title: page.title,
            spaceId: page.spaceId,
            version: page.version.number,
            parentId: page.parentId || null,
            content: page.body.storage,
            status: page.status.value,
            url: page._links.webui
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(simplified, null, 2),
                },
            ],
        };
    }
    catch (error) {
        console.error("Error getting page:", error);
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Failed to get page: ${error instanceof Error ? error.message : String(error)}`);
    }
}
export async function handleCreatePage(client, args) {
    try {
        if (!args.spaceId || !args.title || !args.content) {
            throw new McpError(ErrorCode.InvalidParams, "spaceId, title, and content are required");
        }
        const page = await client.createPage(args.spaceId, args.title, args.content, args.parentId);
        const simplified = {
            id: page.id,
            title: page.title,
            version: page.version.number,
            status: page.status.value,
            url: page._links.webui
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(simplified, null, 2),
                },
            ],
        };
    }
    catch (error) {
        console.error("Error creating page:", error);
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Failed to create page: ${error instanceof Error ? error.message : String(error)}`);
    }
}
export async function handleUpdatePage(client, args) {
    try {
        if (!args.pageId || !args.title || !args.content || args.version === undefined) {
            throw new McpError(ErrorCode.InvalidParams, "pageId, title, content, and version are required");
        }
        const page = await client.updatePage(args.pageId, args.title, args.content, args.version);
        const simplified = {
            id: page.id,
            title: page.title,
            version: page.version.number,
            status: page.status.value,
            url: page._links.webui
        };
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(simplified, null, 2),
                },
            ],
        };
    }
    catch (error) {
        console.error("Error updating page:", error);
        if (error instanceof McpError) {
            throw error;
        }
        throw new McpError(ErrorCode.InternalError, `Failed to update page: ${error instanceof Error ? error.message : String(error)}`);
    }
}
