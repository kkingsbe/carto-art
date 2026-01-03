"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Posters = void 0;
class Posters {
    constructor(client) {
        this.client = client;
    }
    async generate(params) {
        return this.client.post('/posters/generate', params);
    }
}
exports.Posters = Posters;
