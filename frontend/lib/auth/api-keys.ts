import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

// Configuration
const KEY_PREFIX = 'ca_live_';
const KEY_LENGTH = 32;

/**
 * Generates a new secure API key
 * Returns the plain text key (to show once) and the hash (to store)
 */
export async function generateApiKey() {
    // Generate random bytes
    const buffer = randomBytes(KEY_LENGTH);
    const randomString = buffer.toString('hex');

    // Construct full key
    const apiKey = `${KEY_PREFIX}${randomString}`;

    // Hash the key for storage
    // 10 rounds of salt is standard for bcrypt
    const keyHash = await bcrypt.hash(apiKey, 10);

    return {
        apiKey, // Show this to user ONLY ONCE
        keyHash // Store this in DB
    };
}

/**
 * Validates an API key against a stored hash
 */
export async function validateApiKey(apiKey: string, storedHash: string): Promise<boolean> {
    // Basic format check
    if (!apiKey.startsWith(KEY_PREFIX)) {
        return false;
    }

    try {
        return await bcrypt.compare(apiKey, storedHash);
    } catch (error) {
        console.error('Error validating API key:', error);
        return false;
    }
}

/**
 * Extracts the prefix/ID part of a key if we had one (we don't strictly possess a key ID in the string)
 * But we can check format.
 */
export function isValidKeyFormat(apiKey: string): boolean {
    return apiKey.startsWith(KEY_PREFIX) && apiKey.length > KEY_PREFIX.length;
}
