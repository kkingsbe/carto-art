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
export declare class CartoArtClient {
    private apiKey;
    baseUrl: string;
    virtualUserId?: string;
    posters: Posters;
    styles: Styles;
    users: Users;
    maps: Maps;
    comments: Comments;
    constructor(options: CartoArtClientOptions);
    setVirtualUser(userId: string | undefined): void;
    request<T>(path: string, options?: RequestInit): Promise<T>;
    get<T>(path: string): Promise<T>;
    post<T>(path: string, body: any): Promise<T>;
}
