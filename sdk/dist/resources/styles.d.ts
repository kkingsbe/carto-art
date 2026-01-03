import type { CartoArtClient } from '../client';
import { ListStylesResponse } from '../types';
export declare class Styles {
    private client;
    constructor(client: CartoArtClient);
    list(): Promise<ListStylesResponse>;
}
