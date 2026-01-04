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
}
