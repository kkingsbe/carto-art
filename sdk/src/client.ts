import { Posters } from './resources/posters';
import { Styles } from './resources/styles';
import { Users } from './resources/users';
import { Maps } from './resources/maps';
import { Comments } from './resources/comments';

export interface CartoArtClientOptions {
    apiKey: string;
    baseUrl?: string;
    virtualUserId?: string;
}

export class CartoArtClient {
    private apiKey: string;
    public baseUrl: string;
    public virtualUserId?: string;
    public posters: Posters;
    public styles: Styles;
    public users: Users;
    public maps: Maps;
    public comments: Comments;

    constructor(options: CartoArtClientOptions) {
        if (!options.apiKey) {
            throw new Error('API key is required');
        }
        this.apiKey = options.apiKey;
        this.baseUrl = options.baseUrl || 'https://cartoart.net/api/v1';
        this.virtualUserId = options.virtualUserId;

        this.posters = new Posters(this);
        this.styles = new Styles(this);
        this.users = new Users(this);
        this.maps = new Maps(this);
        this.comments = new Comments(this);
    }

    public setVirtualUser(userId: string | undefined) {
        this.virtualUserId = userId;
    }

    public async request<T>(path: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
            ...options.headers as Record<string, string>,
        };

        if (this.virtualUserId) {
            headers['X-Virtual-User-ID'] = this.virtualUserId;
        }

        console.log(`[SDK Debug] Calling: ${options.method || 'GET'} ${url}`);

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({}));
            const message = errorBody.message || errorBody.error || `HTTP Error ${response.status}`;
            const details = errorBody.details ? `: ${errorBody.details}` : '';
            const code = errorBody.code ? ` (${errorBody.code})` : '';
            throw new Error(`${message}${details}${code}`);
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
