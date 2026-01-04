import type { CartoArtClient } from '../client';
import { Comment } from '../types';
export declare class Comments {
    private client;
    constructor(client: CartoArtClient);
    list(mapId: string): Promise<Comment[]>;
    create(mapId: string, content: string): Promise<Comment>;
}
