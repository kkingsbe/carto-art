"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartoArtClient = void 0;
const posters_1 = require("./resources/posters");
const styles_1 = require("./resources/styles");
class CartoArtClient {
    constructor(options) {
        if (!options.apiKey) {
            throw new Error('API key is required');
        }
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl || 'https://cartoart.net/api/v1';
        this.posters = new posters_1.Posters(this);
        this.styles = new styles_1.Styles(this);
    }
    async request(path, options = {}) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...options.headers,
        };
        console.log(`[SDK] Requesting ${url}`);
        console.log(`[SDK] Key Length: ${this.apiKey?.length}`);
        console.log(`[SDK] Headers:`, JSON.stringify(headers, null, 2));
        const response = await fetch(url, {
            ...options,
            headers,
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const message = errorBody.message || errorBody.error || `HTTP Error ${response.status}`;
            throw new Error(message);
        }
        return response.json();
    }
    async get(path) {
        return this.request(path, { method: 'GET' });
    }
    async post(path, body) {
        return this.request(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
}
exports.CartoArtClient = CartoArtClient;
