import dotenv from 'dotenv';
import path from 'path';

export function checkEnv() {
    dotenv.config({ path: path.join(__dirname, '../.env') });

    console.log('Testing .env loading...');
    console.log('LOCATIONIQ_API_KEY:', process.env.LOCATIONIQ_API_KEY);
    console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

    if (process.env.LOCATIONIQ_API_KEY) {
        console.log('LOCATIONIQ_API_KEY length:', process.env.LOCATIONIQ_API_KEY.length);
    }
    if (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
        console.log('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY length:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.length);
    }
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    checkEnv();
}
