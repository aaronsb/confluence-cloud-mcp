export interface ConfluenceConfig {
  domain: string;
  auth: {
    type: 'basic' | 'oauth2';
    // Basic auth
    email?: string;
    apiToken?: string;
    // OAuth2
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
  };
  userAgent?: string;
}

// V2 Space type
export interface Space {
  id: string; // Changed to string per v2 spec
  key: string;
  name: string;
  type: 'global' | 'personal';
  status: 'current' | 'archived';
  homepageId?: string; // Added in v2
  description?: {
    plain: {
      value: string;
      representation: 'plain';
    };
  };
  icon?: {
    path: string;
    width: number;
    height: number;
  };
  _links: {
    webui: string;
    self: string;
  };
}

// V2 Page type
export interface Page {
  id: string;
  status: {
    value: 'current' | 'archived' | 'draft' | 'trashed';
  };
  title: string;
  spaceId: string; // Changed to match v2
  parentId?: string;
  authorId: string;
  createdAt: string;
  version: {
    number: number;
    message?: string;
    createdAt: string;
    authorId: string;
    minorEdit: boolean;
  };
  body: {
    storage: {
      value: string;
      representation: 'storage';
    };
    atlas_doc_format?: {
      value: string;
      representation: 'atlas_doc_format';
    };
  };
  _links: {
    webui: string;
    editui: string;
    tinyui: string;
  };
}

// V2 Label type
export interface Label {
  id: string; // Required in v2
  name: string;
  prefix: 'global' | 'my' | 'team';
  createdAt: string;
  _links: {
    self: string;
  };
}

// V1 Search Response types
export interface V1SearchResponse {
  results: V1SearchResult[];
  start: number;
  limit: number;
  size: number;
  _links: {
    next?: string;
    self: string;
  };
}

export interface V1SearchResult {
  content: {
    id: string;
    type: string;
    status: string;
    title: string;
    space: {
      id: string;
      key: string;
      name: string;
    };
    version: {
      number: number;
      createdAt: string;
    };
    _links: {
      webui: string;
    };
  };
}

// V2 Search Result type (TODO: V2 API ready when search is more robust)
export interface SearchResult extends PaginatedResponse<Page> {
  results: Page[];
}

// Generic paginated response
export interface PaginatedResponse<T> {
  results: T[];
  start: number;
  limit: number;
  size: number;
  totalSize?: number;
  _links: {
    next?: string;
    self: string;
  };
}

// V2 Error Response
export interface ConfluenceError {
  statusCode: number;
  message: string;
  data?: {
    authorized?: boolean;
    valid?: boolean;
    allowedParams?: string[];
    successful?: boolean;
    failed?: boolean;
  };
}

// Rate Limit Info
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
}
