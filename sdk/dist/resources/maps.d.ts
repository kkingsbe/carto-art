import type { CartoArtClient } from '../client';
import { VoteValue } from '../types';
export declare class Maps {
    private client;
    constructor(client: CartoArtClient);
    vote(mapId: string, value: VoteValue): Promise<void>;
    unvote(mapId: string): Promise<void>;
    create(config: import('../types').CreatePosterRequest, title: string, options?: {
        subtitle?: string;
        is_published?: boolean;
    }): Promise<import('../types').SavedMap>;
}
