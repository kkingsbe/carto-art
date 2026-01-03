import { Posters } from './resources/posters';
import { Styles } from './resources/styles';

export interface CartoArtClientOptions {
    apiKey: string;
    baseUrl?: string;
}

export class CartoArtClient {
    private apiKey: string;
    private baseUrl: string;

    public posters: Posters;
    public styles: Styles;

    constructor(options: CartoArtClientOptions) {
        if (!options.apiKey) {
            throw new Error('API key is required');
        }
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl || 'https://cartoart.net/api/v1';

        this.posters = new Posters(this);
        this.styles = new Styles(this);
    }

    private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...options.headers as Record<string, string>,
        };

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const message = errorBody.message || errorBody.error || `HTTP Error ${response.status}`;
            throw new Error(message);
        }

        return response.json();
    }

    async get<T>(path: string): Promise<T> {
        return this.request<T>(path, { method: 'GET' });
    }

    async post<T>(path: string, body: any): Promise<T> {
        return this.request<T>(path, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    }
}
