"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Maps = void 0;
class Maps {
    constructor(client) {
        this.client = client;
    }
    async vote(mapId, value) {
        await this.client.post(`/maps/${mapId}/vote`, { value });
    }
    async unvote(mapId) {
        await this.client.request(`/maps/${mapId}/vote`, { method: 'DELETE' });
    }
    async create(config, title, options) {
        const response = await this.client.post('/maps', {
            config,
            title,
            ...options
        });
        return response.map;
    }
}
exports.Maps = Maps;
