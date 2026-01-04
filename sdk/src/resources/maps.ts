import type { CartoArtClient } from '../client';
import { VoteValue } from '../types';

export class Maps {
    constructor(private client: CartoArtClient) { }

    async vote(mapId: string, value: VoteValue): Promise<void> {
        await this.client.post<void>(`/maps/${mapId}/vote`, { value });
    }

    async unvote(mapId: string): Promise<void> {
        await this.client.request<void>(`/maps/${mapId}/vote`, { method: 'DELETE' });
    }

    async create(config: import('../types').CreatePosterRequest, title: string, options?: { subtitle?: string, is_published?: boolean }): Promise<import('../types').SavedMap> {
        const response = await this.client.post<{ map: import('../types').SavedMap }>('/maps', {
            config,
            title,
            ...options
        });
        return response.map;
    }
}
