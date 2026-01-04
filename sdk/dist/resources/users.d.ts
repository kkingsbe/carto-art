import type { CartoArtClient } from '../client';
export interface SocialProfile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    is_following: boolean;
}
export declare class Users {
    private client;
    constructor(client: CartoArtClient);
    follow(userId: string): Promise<void>;
    unfollow(userId: string): Promise<void>;
    listVirtual(): Promise<import('../types').VirtualUser[]>;
    createVirtual(data: import('../types').CreateVirtualUserRequest): Promise<import('../types').VirtualUser>;
    deleteVirtual(id: string): Promise<void>;
}
