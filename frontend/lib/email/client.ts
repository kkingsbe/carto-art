import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;

export const resend = new Resend(apiKey || 're_123'); // Fallback to avoid crash on init, but checks later

export const hasEmailConfig = () => !!process.env.RESEND_API_KEY;

export const EMAIL_FROM = 'Carto-Art <orders@cartoart.net>'; // Or your verified domain
