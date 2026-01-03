import type { CartoArtClient } from '../client';
import { CreatePosterRequest, PosterResponse } from '../types';
export declare class Posters {
    private client;
    constructor(client: CartoArtClient);
    generate(params: CreatePosterRequest): Promise<PosterResponse>;
}
