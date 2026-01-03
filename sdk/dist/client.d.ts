import { Posters } from './resources/posters';
import { Styles } from './resources/styles';
export interface CartoArtClientOptions {
    apiKey: string;
    baseUrl?: string;
}
export declare class CartoArtClient {
    private apiKey;
    private baseUrl;
    posters: Posters;
    styles: Styles;
    constructor(options: CartoArtClientOptions);
    private request;
    get<T>(path: string): Promise<T>;
    post<T>(path: string, body: any): Promise<T>;
}
