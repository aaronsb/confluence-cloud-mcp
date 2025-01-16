#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { ConfluenceClient } from "./client/confluence-client.js";
import { handleGetSpace, handleListSpaces } from "./handlers/space-handlers.js";
import {
  handleCreatePage,
  handleGetPage,
  handleListPages,
  handleUpdatePage,
} from "./handlers/page-handlers.js";
import {
  handleAddLabel,
  handleGetLabels,
  handleRemoveLabel,
  handleSearchContent,
} from "./handlers/search-label-handlers.js";
import { toolSchemas } from "./schemas/tool-schemas.js";

// Initialize authentication configuration
function initializeAuthConfig() {
  const domain = process.env.CONFLUENCE_DOMAIN;
  if (!domain) {
    throw new Error('Missing required environment variable: CONFLUENCE_DOMAIN');
  }

  // Check for OAuth2 configuration
  if (process.env.CONFLUENCE_OAUTH_ACCESS_TOKEN) {
    return {
      domain,
      auth: {
        type: 'oauth2' as const,
        accessToken: process.env.CONFLUENCE_OAUTH_ACCESS_TOKEN,
        refreshToken: process.env.CONFLUENCE_OAUTH_REFRESH_TOKEN,
        clientId: process.env.CONFLUENCE_OAUTH_CLIENT_ID,
        clientSecret: process.env.CONFLUENCE_OAUTH_CLIENT_SECRET
      }
    };
  }

  // Fall back to basic auth
  const email = process.env.CONFLUENCE_EMAIL;
  const apiToken = process.env.CONFLUENCE_API_TOKEN;
  
  if (!email || !apiToken) {
    throw new Error('Either OAuth2 access token or basic auth credentials (email and API token) must be provided');
  }

  return {
    domain,
    auth: {
      type: 'basic' as const,
      email,
      apiToken
    }
  };
}

class ConfluenceServer {
  private server: Server;
  private confluenceClient: ConfluenceClient;

  constructor() {
    console.error("Loading tool schemas...");
    console.error("Available schemas:", Object.keys(toolSchemas));

    // Convert tool schemas to the format expected by the MCP SDK
    const tools = Object.entries(toolSchemas).map(([key, schema]) => {
      console.error(`Registering tool: ${key}`);
      const inputSchema = {
        type: "object",
        properties: schema.inputSchema.properties,
        ...(schema.inputSchema.required ? { required: schema.inputSchema.required } : {})
      } as const;

      return {
        name: key,
        description: schema.description,
        inputSchema,
      };
    });

    console.error("Initializing server with tools:", JSON.stringify(tools, null, 2));

    this.server = new Server(
      {
        name: "confluence-cloud",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {
            schemas: tools,
          },
          resources: {
            schemas: [], // Explicitly define empty resources
          },
        },
      }
    );

    const config = initializeAuthConfig();
    
    console.error('Initializing Confluence client with config:', {
      domain: config.domain,
      authType: config.auth.type,
      // Mask sensitive data in logs
      ...(config.auth.type === 'basic'
        ? { email: config.auth.email }
        : { hasAccessToken: !!config.auth.accessToken })
    });

    this.confluenceClient = new ConfluenceClient(config);

    this.setupHandlers();

    this.server.onerror = (error) => console.error("[MCP Error]", error);
    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers() {
    // Set up required MCP protocol handlers
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: Object.entries(toolSchemas).map(([key, schema]) => ({
        name: key,
        description: schema.description,
        inputSchema: schema.inputSchema
      })),
    }));

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [], // No resources provided by this server
    }));

    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => ({
      resourceTemplates: [], // No resource templates provided by this server
    }));

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      throw new McpError(
        ErrorCode.InvalidRequest,
        `No resources available: ${request.params.uri}`
      );
    });

    // Set up tool handlers
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error("Received request:", JSON.stringify(request, null, 2));

      const { name, arguments: args } = request.params;
      console.error(`Handling tool request: ${name}`);

      try {
        switch (name) {
          // Space operations
          case "list_spaces": {
            const { limit, cursor, sort } = (args || {}) as {
              limit?: number;
              cursor?: string;
              sort?: 'name' | '-name' | 'key' | '-key';
            };
            return await handleListSpaces(this.confluenceClient, { limit, cursor, sort });
          }
          case "get_space": {
            const { spaceId } = (args || {}) as { spaceId: string };
            if (!spaceId) throw new McpError(ErrorCode.InvalidParams, "spaceId is required");
            return await handleGetSpace(this.confluenceClient, { spaceId });
          }

          // Page operations
          case "list_pages": {
            const { spaceId, limit, cursor, sort, status } = (args || {}) as {
              spaceId: string;
              limit?: number;
              cursor?: string;
              sort?: 'created-date' | '-created-date' | 'modified-date' | '-modified-date' | 'title' | '-title';
              status?: 'current' | 'archived' | 'draft' | 'trashed';
            };
            if (!spaceId) throw new McpError(ErrorCode.InvalidParams, "spaceId is required");
            return await handleListPages(this.confluenceClient, { spaceId, limit, cursor, sort, status });
          }
          case "get_page": {
            const { pageId } = (args || {}) as { pageId: string };
            if (!pageId) throw new McpError(ErrorCode.InvalidParams, "pageId is required");
            return await handleGetPage(this.confluenceClient, { pageId });
          }
          case "create_page": {
            const { spaceId, title, content, parentId } = (args || {}) as { 
              spaceId: string; 
              title: string; 
              content: string; 
              parentId?: string 
            };
            if (!spaceId || !title || !content) {
              throw new McpError(ErrorCode.InvalidParams, "spaceId, title, and content are required");
            }
            return await handleCreatePage(this.confluenceClient, { spaceId, title, content, parentId });
          }
          case "update_page": {
            const { pageId, title, content, version } = (args || {}) as {
              pageId: string;
              title: string;
              content: string;
              version: number;
            };
            if (!pageId || !title || !content || version === undefined) {
              throw new McpError(ErrorCode.InvalidParams, "pageId, title, content, and version are required");
            }
            return await handleUpdatePage(this.confluenceClient, { pageId, title, content, version });
          }

          // Search operation
          case "search_content": {
            const { cql, limit, cursor } = (args || {}) as {
              cql: string;
              limit?: number;
              cursor?: string;
            };
            if (!cql) throw new McpError(ErrorCode.InvalidParams, "cql is required");
            return await handleSearchContent(this.confluenceClient, {
              cql,
              limit,
              cursor
            });
          }

          // Label operations
          case "get_labels": {
            const { pageId } = (args || {}) as { pageId: string };
            if (!pageId) throw new McpError(ErrorCode.InvalidParams, "pageId is required");
            return await handleGetLabels(this.confluenceClient, { pageId });
          }
          case "add_label": {
            const { contentId, prefix, name } = (args || {}) as { contentId: string; prefix: string; name: string };
            if (!contentId || !prefix || !name) {
              throw new McpError(ErrorCode.InvalidParams, "contentId, prefix, and name are required");
            }
            if (prefix !== "global") {
              throw new McpError(ErrorCode.InvalidParams, "prefix must be 'global'");
            }
            return await handleAddLabel(this.confluenceClient, { contentId, prefix, name });
          }
          case "remove_label": {
            const { pageId, label } = (args || {}) as { pageId: string; label: string };
            if (!pageId || !label) throw new McpError(ErrorCode.InvalidParams, "pageId and label are required");
            return await handleRemoveLabel(this.confluenceClient, { pageId, label });
          }

          default:
            throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
      } catch (error) {
        console.error("Error handling request:", error);
        if (error instanceof McpError) {
          throw error;
        }
        throw new McpError(
          ErrorCode.InternalError,
          `Internal server error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Confluence Cloud MCP server running on stdio");
  }
}

const server = new ConfluenceServer();
server.run().catch(console.error);
