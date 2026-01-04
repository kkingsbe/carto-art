"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartoArtClient = void 0;
const posters_1 = require("./resources/posters");
const styles_1 = require("./resources/styles");
const users_1 = require("./resources/users");
const maps_1 = require("./resources/maps");
const comments_1 = require("./resources/comments");
class CartoArtClient {
    constructor(options) {
        if (!options.apiKey) {
            throw new Error('API key is required');
        }
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl || 'https://cartoart.net/api/v1';
        this.virtualUserId = options.virtualUserId;
        this.posters = new posters_1.Posters(this);
        this.styles = new styles_1.Styles(this);
        this.users = new users_1.Users(this);
        this.maps = new maps_1.Maps(this);
        this.comments = new comments_1.Comments(this);
    }
    setVirtualUser(userId) {
        this.virtualUserId = userId;
    }
    async request(path, options = {}) {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...options.headers,
        };
        if (this.virtualUserId) {
            headers['X-Virtual-User-ID'] = this.virtualUserId;
        }
        console.log(`[SDK Debug] Calling: ${options.method || 'GET'} ${url}`);
        const response = await fetch(url, {
            ...options,
            headers,
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const message = errorBody.message || errorBody.error || `HTTP Error ${response.status}`;
            const details = errorBody.details ? `: ${errorBody.details}` : '';
            const code = errorBody.code ? ` (${errorBody.code})` : '';
            throw new Error(`${message}${details}${code}`);
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
