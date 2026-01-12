import { createClient } from '@/lib/supabase/server';
import { ensureAdmin } from '@/lib/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        await ensureAdmin();
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const timeRange = searchParams.get('timeRange') || '30d';
        const ratingFilter = searchParams.get('rating') || 'all';
        const triggerType = searchParams.get('triggerType') || 'all';
        const searchQuery = searchParams.get('search') || '';
        const statusFilter = searchParams.get('status') || 'all';
        const categoryFilter = searchParams.get('category') || 'all';
        const offset = parseInt(searchParams.get('offset') || '0');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build base query
        let query = (supabase as any)
            .from('feedback')
            .select(`
                id,
                user_id,
                session_id,
                trigger_type,
                trigger_context,
                overall_rating,
                nps_score,
                use_cases,
                pain_points,
                feature_ratings,
                open_feedback,
                allow_followup,
                status,
                admin_category,
                admin_notes,
                created_at,
                user_agent,
                page_url,
                profiles:user_id (
                    username,
                    display_name,
                    avatar_url
                )
            `, { count: 'exact' });

        // Apply time range filter
        if (timeRange !== 'all') {
            const days = parseInt(timeRange.replace('d', ''));
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - days);
            query = query.gte('created_at', fromDate.toISOString());
        }

        // Apply rating filter
        if (ratingFilter !== 'all') {
            if (ratingFilter === 'high') {
                query = query.gte('overall_rating', 4);
            } else if (ratingFilter === 'low') {
                query = query.lte('overall_rating', 2);
            }
        }

        // Apply trigger type filter
        if (triggerType !== 'all') {
            query = query.eq('trigger_type', triggerType);
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter);
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            query = query.eq('admin_category', categoryFilter);
        }

        // Apply search filter (on open_feedback and admin_notes)
        if (searchQuery) {
            query = query.or(`open_feedback.ilike.%${searchQuery}%,admin_notes.ilike.%${searchQuery}%`);
        }

        // Apply pagination and ordering
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        const { data: feedback, error, count } = await query as { data: any[] | null; error: any; count: number | null };

        if (error) throw error;

        // Calculate statistics
        const statsQuery = (supabase as any)
            .from('feedback')
            .select('created_at, overall_rating, nps_score, status');

        // Apply same filters for stats
        let statsQueryFiltered = statsQuery;
        if (timeRange !== 'all') {
            const days = parseInt(timeRange.replace('d', ''));
            const fromDate = new Date();
            fromDate.setDate(fromDate.getDate() - days);
            statsQueryFiltered = statsQueryFiltered.gte('created_at', fromDate.toISOString());
        }
        if (ratingFilter !== 'all') {
            if (ratingFilter === 'high') {
                statsQueryFiltered = statsQueryFiltered.gte('overall_rating', 4);
            } else if (ratingFilter === 'low') {
                statsQueryFiltered = statsQueryFiltered.lte('overall_rating', 2);
            }
        }
        if (triggerType !== 'all') {
            statsQueryFiltered = statsQueryFiltered.eq('trigger_type', triggerType);
        }
        if (statusFilter !== 'all') {
            statsQueryFiltered = statsQueryFiltered.eq('status', statusFilter);
        }
        if (categoryFilter !== 'all') {
            statsQueryFiltered = statsQueryFiltered.eq('admin_category', categoryFilter);
        }

        const { data: statsData, error: statsError } = await statsQueryFiltered as { data: Array<{ created_at: string; overall_rating: number; nps_score: number | null; status: string }> | null; error: any };

        if (statsError) throw statsError;

        // Calculate aggregates
        const total = statsData?.length || 0;
        const average_rating = total > 0 && statsData
            ? statsData.reduce((sum, item) => sum + item.overall_rating, 0) / total
            : 0;

        const withNPS = statsData?.filter(item => item.nps_score !== null) || [];
        const total_with_nps = withNPS.length;
        const nps_score = total_with_nps > 0
            ? withNPS.reduce((sum, item) => sum + (item.nps_score || 0), 0) / total_with_nps
            : 0;

        const promoters = withNPS.filter(item => (item.nps_score || 0) >= 9).length;
        const passives = withNPS.filter(item => (item.nps_score || 0) >= 7 && (item.nps_score || 0) <= 8).length;
        const detractors = withNPS.filter(item => (item.nps_score || 0) <= 6).length;

        // Calculate NPS percentage
        const nps_percentage = total_with_nps > 0
            ? ((promoters - detractors) / total_with_nps) * 100
            : 0;

        // Calculate Status Breakdown
        const statusBreakdown = statsData?.reduce((acc: any, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {});

        // Calculate Trend Data (Group by Day)
        const trendMap = new Map<string, { total_rating: number; count: number; total_nps: number; nps_count: number }>();

        statsData?.forEach(item => {
            const date = new Date(item.created_at).toISOString().split('T')[0];
            const current = trendMap.get(date) || { total_rating: 0, count: 0, total_nps: 0, nps_count: 0 };

            current.total_rating += item.overall_rating;
            current.count += 1;

            if (item.nps_score !== null) {
                current.total_nps += item.nps_score;
                current.nps_count += 1;
            }

            trendMap.set(date, current);
        });

        const trend = Array.from(trendMap.entries())
            .map(([date, data]) => ({
                date,
                rating: Math.round((data.total_rating / data.count) * 10) / 10,
                nps: data.nps_count > 0 ? Math.round((data.total_nps / data.nps_count) * 10) / 10 : null,
                count: data.count
            }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Format feedback data
        const formattedFeedback = feedback?.map(item => ({
            id: item.id,
            user_id: item.user_id,
            username: (item.profiles as any)?.username || null,
            display_name: (item.profiles as any)?.display_name || null,
            avatar_url: (item.profiles as any)?.avatar_url || null,
            session_id: item.session_id,
            trigger_type: item.trigger_type,
            trigger_context: item.trigger_context,
            overall_rating: item.overall_rating,
            nps_score: item.nps_score,
            use_cases: item.use_cases,
            pain_points: item.pain_points,
            feature_ratings: item.feature_ratings,
            open_feedback: item.open_feedback,
            allow_followup: item.allow_followup,
            status: item.status,
            admin_category: item.admin_category,
            admin_notes: item.admin_notes,
            created_at: item.created_at,
            user_agent: item.user_agent,
            page_url: item.page_url,
        })) || [];

        return NextResponse.json({
            feedback: formattedFeedback,
            stats: {
                total,
                average_rating: Math.round(average_rating * 100) / 100,
                nps_score: Math.round(nps_score * 10) / 10,
                nps_percentage: Math.round(nps_percentage),
                total_with_nps,
                promoters,
                passives,
                detractors,
                status_breakdown: statusBreakdown,
            },
            trend,
            pagination: {
                total: count || 0,
                offset,
                limit,
            },
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 403 });
    }
}
