import { BetaAnalyticsDataClient } from '@google-analytics/data';

/**
 * Initialize the Google Analytics Data API client.
 * Credentials should be provided via environment variables.
 */
function getGAClient() {
    const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        throw new Error('Google Analytics credentials not fully configured');
    }

    return new BetaAnalyticsDataClient({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
        },
    });
}

export interface AnalyticsReport {
    views: number;
    sessions: number;
    activeUsers: number;
    topPages: Array<{ url: string; views: number }>;
}

/**
 * Fetch core metrics for the last 30 days.
 */
export async function getCoreTrafficStats(): Promise<AnalyticsReport> {
    const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
    if (!propertyId) {
        throw new Error('GOOGLE_ANALYTICS_PROPERTY_ID is not set');
    }

    const client = getGAClient();

    // 1. Fetch Summary Metrics
    const [response] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        metrics: [
            { name: 'screenPageViews' },
            { name: 'sessions' },
            { name: 'activeUsers' },
        ],
    });

    const metricsData = response.rows?.[0]?.metricValues || [];

    // 2. Fetch Top Pages
    const [pageResponse] = await client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: '30daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        limit: 10,
        orderBys: [
            {
                metric: { metricName: 'screenPageViews' },
                desc: true,
            },
        ],
    });

    const topPages = pageResponse.rows?.map(row => ({
        url: row.dimensionValues?.[0]?.value || 'unknown',
        views: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || [];

    return {
        views: parseInt(metricsData[0]?.value || '0'),
        sessions: parseInt(metricsData[1]?.value || '0'),
        activeUsers: parseInt(metricsData[2]?.value || '0'),
        topPages,
    };
}
