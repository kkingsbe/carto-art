import type { CartoArtClient } from '../client';
import { ListStylesResponse } from '../types';

export class Styles {
    constructor(private client: CartoArtClient) { }

    async list(): Promise<ListStylesResponse> {
        return this.client.get<ListStylesResponse>('/styles');
    }
}
