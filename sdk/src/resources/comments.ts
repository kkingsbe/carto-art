import type { CartoArtClient } from '../client';
import { Comment, ListCommentsResponse } from '../types';

export class Comments {
    constructor(private client: CartoArtClient) { }

    async list(mapId: string): Promise<Comment[]> {
        const response = await this.client.get<ListCommentsResponse>(`/maps/${mapId}/comments`);
        return response.comments;
    }

    async create(mapId: string, content: string): Promise<Comment> {
        const response = await this.client.post<{ comment: Comment }>(`/maps/${mapId}/comments`, { content });
        return response.comment;
    }
}
