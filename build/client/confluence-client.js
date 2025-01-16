import axios from 'axios';
export class ConfluenceClient {
    client;
    rateLimitInfo = {
        limit: 0,
        remaining: 0,
        resetTime: 0
    };
    clientV1;
    constructor(config) {
        if (!config.domain) {
            throw new Error('Domain is required');
        }
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': config.userAgent || 'Confluence-Cloud-MCP/2.0'
        };
        // Configure for v2 API with domain in URL
        const axiosConfig = {
            baseURL: `https://${config.domain}/wiki/api/v2`,
            headers,
            auth: {
                username: config.auth.email,
                password: config.auth.apiToken
            }
        };
        // Configure v1 client for search and labels
        const axiosConfigV1 = {
            baseURL: `https://${config.domain}/wiki/rest/api`,
            headers: {
                ...headers,
                'X-Atlassian-Token': 'no-check'
            },
            auth: {
                username: config.auth.email,
                password: config.auth.apiToken
            }
        };
        this.client = axios.create(axiosConfig);
        this.clientV1 = axios.create(axiosConfigV1);
        // Add response interceptor for rate limit handling
        this.client.interceptors.response.use((response) => {
            this.updateRateLimits(response.headers);
            return response;
        }, async (error) => {
            if (error.response?.status === 429) { // Rate limit exceeded
                const resetTime = parseInt(String(error.response.headers['x-ratelimit-reset'] || '0'), 10);
                const waitTime = Math.max(resetTime - Date.now(), 1000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return this.client.request(error.config);
            }
            throw this.handleError(error);
        });
    }
    updateRateLimits(headers) {
        this.rateLimitInfo = {
            limit: parseInt(String(headers['x-ratelimit-limit'] || '0'), 10),
            remaining: parseInt(String(headers['x-ratelimit-remaining'] || '0'), 10),
            resetTime: parseInt(String(headers['x-ratelimit-reset'] || '0'), 10)
        };
    }
    handleError(error) {
        console.error('Full error response:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            headers: error.response?.headers,
            config: {
                url: error.config?.url,
                method: error.config?.method,
                params: error.config?.params
            }
        });
        if (error.response?.data) {
            const confluenceError = error.response.data;
            return new Error(`Confluence API Error: ${confluenceError.message || JSON.stringify(error.response.data)}`);
        }
        return new Error(`Confluence API Error: ${error.message}`);
    }
    // Space operations
    async getSpaces(options = {}) {
        const response = await this.client.get('/spaces', {
            params: {
                limit: options.limit,
                cursor: options.cursor,
                sort: options.sort,
                status: options.status,
                'description-format': 'plain'
            }
        });
        return response.data;
    }
    async getSpace(spaceId) {
        const response = await this.client.get(`/spaces/${spaceId}`, {
            params: {
                'description-format': 'plain'
            }
        });
        return response.data;
    }
    // Page operations
    async getPages(spaceId, options = {}) {
        const response = await this.client.get('/pages', {
            params: {
                'space-id': spaceId,
                limit: options.limit,
                cursor: options.cursor,
                title: options.title,
                status: options.status,
                sort: options.sort,
                'body-format': 'storage'
            }
        });
        return response.data;
    }
    async getPage(pageId) {
        const response = await this.client.get(`/pages/${pageId}`, {
            params: {
                'body-format': 'storage'
            }
        });
        return response.data;
    }
    async createPage(spaceId, title, content, parentId) {
        const body = {
            spaceId,
            status: 'current',
            title,
            parentId,
            body: {
                representation: 'storage',
                value: content
            }
        };
        const response = await this.client.post('/pages', body);
        return response.data;
    }
    async updatePage(pageId, title, content, version) {
        const body = {
            id: pageId,
            status: 'current',
            title,
            body: {
                representation: 'storage',
                value: content
            },
            version: {
                number: version + 1,
                message: 'Updated via API'
            }
        };
        const response = await this.client.put(`/pages/${pageId}`, body);
        return response.data;
    }
    // Label operations
    async getLabels(pageId) {
        const response = await this.client.get(`/pages/${pageId}/labels`);
        return response.data;
    }
    async addLabel(contentId, prefix, name) {
        const response = await this.clientV1.post(`content/${contentId}/label`, {
            prefix,
            name
        });
        return response.data;
    }
    async removeLabel(pageId, labelName) {
        await this.clientV1.delete(`/content/${pageId}/label/${labelName}`);
    }
    // Search operations
    // TODO: V2 API ready when search is more robust
    // async searchContent(
    //   title: string,
    //   options: {
    //     limit?: number;
    //     cursor?: string;
    //     'space-id'?: string;
    //     sort?: 'created-date' | '-created-date' | 'modified-date' | '-modified-date' | 'title' | '-title';
    //     status?: 'current' | 'archived' | 'draft' | 'trashed';
    //   } = {}
    // ): Promise<PaginatedResponse<Page>> {
    //   const response = await this.client.get('/pages', {
    //     params: {
    //       title,
    //       limit: options.limit,
    //       cursor: options.cursor,
    //       'space-id': options['space-id'],
    //       sort: options.sort,
    //       status: options.status,
    //       'body-format': 'storage'
    //     }
    //   });
    //   return response.data;
    // }
    // V1 Search implementation with CQL support
    async searchContentV1(cql, options = {}) {
        const response = await this.clientV1.get('/search', {
            params: {
                cql,
                limit: options.limit,
                start: options.start,
                expand: 'content.space,content.version'
            }
        });
        return response.data;
    }
    // Get rate limit information
    getRateLimitInfo() {
        return { ...this.rateLimitInfo };
    }
}
