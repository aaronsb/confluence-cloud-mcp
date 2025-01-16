# Confluence MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with Confluence Cloud. This server enables AI assistants to manage Confluence spaces, pages, and content through a standardized interface.

## Features

- Space Management
  - List spaces
  - Get space details
- Page Operations
  - Create, read, update pages
  - List pages in a space
- Search & Labels
  - Search content using CQL
  - Manage page labels

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env` file with your Confluence credentials:
```
CONFLUENCE_HOST=your-domain.atlassian.net
CONFLUENCE_USERNAME=your-email@domain.com
CONFLUENCE_API_TOKEN=your-api-token
```

3. Build the project:
```bash
npm run build
```

## Usage

The server can be integrated with MCP-compatible AI assistants by adding it to their MCP configuration:

```json
{
  "mcpServers": {
    "confluence": {
      "command": "node",
      "args": ["path/to/build/index.js"],
      "env": {
        "CONFLUENCE_DOMAIN”: "your-domain.atlassian.net",
        "CONFLUENCE_EMAIL”: "your-email@domain.com",
        "CONFLUENCE_API_TOKEN": "your-api-token"
      }
    }
  }
}

```

## Available Tools

### Space Tools
- `list_spaces`: List all spaces in Confluence
- `get_space`: Get details about a specific space

### Page Tools
- `list_pages`: List pages in a space
- `get_page`: Get a specific page with its content
- `create_page`: Create a new page in a space
- `update_page`: Update an existing page

### Search & Label Tools
- `search_content`: Search Confluence content using CQL
- `get_labels`: Get labels for a page
- `add_label`: Add a label to a page
- `remove_label`: Remove a label from a page

## Development

This project is written in TypeScript and follows the MCP SDK conventions for implementing server capabilities. The codebase is organized into:

- `src/client/` - Confluence API client implementation
- `src/handlers/` - MCP tool request handlers
- `src/schemas/` - JSON schemas for tool inputs
- `src/types/` - TypeScript type definitions

## License

MIT
