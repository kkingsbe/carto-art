"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Comments = void 0;
class Comments {
    constructor(client) {
        this.client = client;
    }
    async list(mapId) {
        const response = await this.client.get(`/maps/${mapId}/comments`);
        return response.comments;
    }
    async create(mapId, content) {
        const response = await this.client.post(`/maps/${mapId}/comments`, { content });
        return response.comment;
    }
}
exports.Comments = Comments;
