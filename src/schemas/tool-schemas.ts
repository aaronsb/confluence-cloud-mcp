interface ToolSchema {
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export const toolSchemas: Record<string, ToolSchema> = {
  list_spaces: {
    description: "List all spaces in Confluence",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Maximum number of spaces to return (default: 25, max: 250)",
        },
        cursor: {
          type: "string",
          description: "Cursor for pagination, obtained from _links.next",
        },
        sort: {
          type: "string",
          enum: ["name", "-name", "key", "-key"],
          description: "Sort spaces by field (prefix with - for descending)",
        },
      },
    },
  },

  get_space: {
    description: "Get details about a specific space",
    inputSchema: {
      type: "object",
      properties: {
        spaceId: {
          type: "string",
          description: "ID of the space to retrieve",
        },
      },
      required: ["spaceId"],
    },
  },

  list_pages: {
    description: "List pages in a space",
    inputSchema: {
      type: "object",
      properties: {
        spaceId: {
          type: "string",
          description: "ID of the space to list pages from",
        },
        limit: {
          type: "number",
          description: "Maximum number of pages to return (default: 25, max: 250)",
        },
        cursor: {
          type: "string",
          description: "Cursor for pagination, obtained from _links.next",
        },
        sort: {
          type: "string",
          enum: ["created-date", "-created-date", "modified-date", "-modified-date", "title", "-title"],
          description: "Sort pages by field (prefix with - for descending)",
        },
        status: {
          type: "string",
          enum: ["current", "archived", "draft", "trashed"],
          description: "Filter pages by status",
        },
      },
      required: ["spaceId"],
    },
  },

  get_page: {
    description: "Get a specific page with its content",
    inputSchema: {
      type: "object",
      properties: {
        pageId: {
          type: "string",
          description: "ID of the page to retrieve",
        },
      },
      required: ["pageId"],
    },
  },

  create_page: {
    description: "Create a new page in a space",
    inputSchema: {
      type: "object",
      properties: {
        spaceId: {
          type: "string",
          description: "ID of the space to create the page in",
        },
        title: {
          type: "string",
          description: "Title of the page",
        },
        content: {
          type: "string",
          description: "Content of the page in Confluence storage format",
        },
        parentId: {
          type: "string",
          description: "ID of the parent page (optional)",
        },
      },
      required: ["spaceId", "title", "content"],
    },
  },

  update_page: {
    description: "Update an existing page",
    inputSchema: {
      type: "object",
      properties: {
        pageId: {
          type: "string",
          description: "ID of the page to update",
        },
        title: {
          type: "string",
          description: "New title of the page",
        },
        content: {
          type: "string",
          description: "New content in Confluence storage format",
        },
        version: {
          type: "number",
          description: "Current version number of the page",
        },
      },
      required: ["pageId", "title", "content", "version"],
    },
  },

  search_content: {
    description: "Search Confluence content using v1 search API with CQL",
    inputSchema: {
      type: "object",
      properties: {
        cql: {
          type: "string",
          description: "CQL query string (e.g. 'text ~ \"search term\"')",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (default: 25)",
        },
        cursor: {
          type: "string",
          description: "Start index for pagination",
        },
        'space-id': {
          type: "string",
          description: "Filter results to a specific space",
        }
      },
      required: ["cql"],
    },
  },

  get_labels: {
    description: "Get labels for a page",
    inputSchema: {
      type: "object",
      properties: {
        pageId: {
          type: "string",
          description: "ID of the page",
        },
      },
      required: ["pageId"],
    },
  },

  add_label: {
    description: "Add a label to content using Confluence v1 API",
    inputSchema: {
      type: "object",
      properties: {
        contentId: {
          type: "string",
          description: "ID of the content to add the label to"
        },
        prefix: {
          type: "string",
          description: "Label prefix (should be 'global')",
          enum: ["global"]
        },
        name: {
          type: "string",
          description: "Name of the label to add"
        }
      },
      required: ["contentId", "prefix", "name"],
    },
  },

  remove_label: {
    description: "Remove a label from a page",
    inputSchema: {
      type: "object",
      properties: {
        pageId: {
          type: "string",
          description: "ID of the page",
        },
        label: {
          type: "string",
          description: "Label to remove",
        },
      },
      required: ["pageId", "label"],
    },
  },
} as const;
