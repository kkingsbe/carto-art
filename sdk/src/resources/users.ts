import type { CartoArtClient } from '../client';

export interface SocialProfile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_following: boolean;
}

export class Users {
    constructor(private client: CartoArtClient) { }

    async follow(userId: string): Promise<void> {
        await this.client.post<void>(`/users/${userId}/follow`, {});
    }

    async unfollow(userId: string): Promise<void> {
        await this.client.request<void>(`/users/${userId}/follow`, { method: 'DELETE' });
    }

    async listVirtual(): Promise<import('../types').VirtualUser[]> {
        const response = await this.client.get<{ users: import('../types').VirtualUser[] }>('/virtual-users');
        return response.users;
    }

    async createVirtual(data: import('../types').CreateVirtualUserRequest): Promise<import('../types').VirtualUser> {
        const response = await this.client.post<{ user: import('../types').VirtualUser }>('/virtual-users', data);
        return response.user;
    }

    async deleteVirtual(id: string): Promise<void> {
        await this.client.request<void>(`/virtual-users/${id}`, { method: 'DELETE' });
    }
}
