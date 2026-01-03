import type { CartoArtClient } from '../client';
import { CreatePosterRequest, PosterResponse } from '../types';

export class Posters {
    constructor(private client: CartoArtClient) { }

    async generate(params: CreatePosterRequest): Promise<PosterResponse> {
        return this.client.post<PosterResponse>('/posters/generate', params);
    }
}
