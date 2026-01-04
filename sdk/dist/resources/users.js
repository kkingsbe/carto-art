"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Users = void 0;
class Users {
    constructor(client) {
        this.client = client;
    }
    async follow(userId) {
        await this.client.post(`/users/${userId}/follow`, {});
    }
    async unfollow(userId) {
        await this.client.request(`/users/${userId}/follow`, { method: 'DELETE' });
    }
    async listVirtual() {
        const response = await this.client.get('/virtual-users');
        return response.users;
    }
    async createVirtual(data) {
        const response = await this.client.post('/virtual-users', data);
        return response.user;
    }
    async deleteVirtual(id) {
        await this.client.request(`/virtual-users/${id}`, { method: 'DELETE' });
    }
}
exports.Users = Users;
