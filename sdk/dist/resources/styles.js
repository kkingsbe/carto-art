"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Styles = void 0;
class Styles {
    constructor(client) {
        this.client = client;
    }
    async list() {
        return this.client.get('/styles');
    }
}
exports.Styles = Styles;
