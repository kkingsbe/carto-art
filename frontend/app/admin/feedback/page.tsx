'use client';

import { useState, useEffect, Fragment } from 'react';
import {
    MessageSquare,
    Star,
    TrendingUp,
    Users,
    Search,
    Loader2,
    ChevronDown,
    Calendar,
    Filter,
    ThumbsUp,
    ThumbsDown,
    Minus,
    ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface FeedbackItem {
    id: string;
    user_id: string | null;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    session_id: string | null;
    trigger_type: string;
    trigger_context: any;
    overall_rating: number;
    nps_score: number | null;
    use_cases: string[] | null;
    pain_points: string[] | null;
    feature_ratings: any;
    open_feedback: string | null;
    allow_followup: boolean;
    created_at: string;
    page_url: string | null;
}

interface FeedbackStats {
    total: number;
    average_rating: number;
    nps_score: number;
    nps_percentage: number;
    total_with_nps: number;
    promoters: number;
    passives: number;
    detractors: number;
}

export default function FeedbackPage() {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [timeRange, setTimeRange] = useState('30d');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [triggerTypeFilter, setTriggerTypeFilter] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchFeedback();
    }, [timeRange, ratingFilter, triggerTypeFilter]);

    const fetchFeedback = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                timeRange,
                rating: ratingFilter,
                triggerType: triggerTypeFilter,
                search: searchQuery,
            });

            const res = await fetch(`/api/admin/feedback?${params}`);
            if (res.ok) {
                const data = await res.json();
                setFeedback(data.feedback);
                setStats(data.stats);
            } else {
                toast.error('Failed to load feedback');
            }
        } catch (error) {
            toast.error('Failed to load feedback');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        fetchFeedback();
    };

    const getNPSCategory = (score: number | null) => {
        if (score === null) return null;
        if (score >= 9) return 'promoter';
        if (score >= 7) return 'passive';
        return 'detractor';
    };

    const getNPSBadge = (score: number | null) => {
        if (score === null) return null;
        const category = getNPSCategory(score);

        if (category === 'promoter') {
            return (
                <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {score}
                </Badge>
            );
        }
        if (category === 'passive') {
            return (
                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 gap-1">
                    <Minus className="w-3 h-3" />
                    {score}
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 gap-1">
                <ThumbsDown className="w-3 h-3" />
                {score}
            </Badge>
        );
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                            }`}
                    />
                ))}
            </div>
        );
    };

    const formatTriggerType = (type: string) => {
        return type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    if (isLoading && !stats) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">User Feedback</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Review submissions and satisfaction scores.
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Feedback</p>
                            <p className="text-2xl font-bold mt-1">{stats?.total || 0}</p>
                        </div>
                        <MessageSquare className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
                            <p className="text-2xl font-bold mt-1">{stats?.average_rating.toFixed(1) || '0.0'}</p>
                        </div>
                        <Star className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div className="mt-2">
                        {stats && renderStars(Math.round(stats.average_rating))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">NPS Score</p>
                            <p className="text-2xl font-bold mt-1">{stats?.nps_percentage || 0}</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {stats?.total_with_nps || 0} responses
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">NPS Breakdown</p>
                        </div>
                        <Users className="w-8 h-8 text-purple-500" />
                    </div>
                    <div className="mt-2 space-y-1 text-xs">
                        <div className="flex justify-between">
                            <span className="text-green-600 dark:text-green-400">Promoters</span>
                            <span className="font-semibold">{stats?.promoters || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-yellow-600 dark:text-yellow-400">Passives</span>
                            <span className="font-semibold">{stats?.passives || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-red-600 dark:text-red-400">Detractors</span>
                            <span className="font-semibold">{stats?.detractors || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        className="pl-10"
                        placeholder="Search feedback..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <Select value={timeRange} onValueChange={setTimeRange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Time range" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All ratings</SelectItem>
                        <SelectItem value="high">High (4-5★)</SelectItem>
                        <SelectItem value="low">Low (1-2★)</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={triggerTypeFilter} onValueChange={setTriggerTypeFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Trigger" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All triggers</SelectItem>
                        <SelectItem value="post_export">Post Export</SelectItem>
                        <SelectItem value="gallery_browse">Gallery Browse</SelectItem>
                        <SelectItem value="voluntary">Voluntary</SelectItem>
                    </SelectContent>
                </Select>

                <Button onClick={handleSearch} variant="outline" size="icon">
                    <Search className="w-4 h-4" />
                </Button>
            </div>

            {/* Feedback Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">NPS</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Trigger</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Feedback</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {feedback.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        {isLoading ? (
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                        ) : (
                                            <>
                                                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                                                <p>No feedback found.</p>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                feedback.map((item) => (
                                    <Fragment key={item.id}>
                                        <tr
                                            className="group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden">
                                                        {item.avatar_url ? (
                                                            <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm">
                                                        {item.username ? (
                                                            <>
                                                                <div className="font-medium">{item.display_name || item.username}</div>
                                                                <div className="text-xs text-gray-500">@{item.username}</div>
                                                            </>
                                                        ) : (
                                                            <div className="text-gray-500 italic">Anonymous</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {renderStars(item.overall_rating)}
                                            </td>
                                            <td className="px-6 py-4">
                                                {getNPSBadge(item.nps_score)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="text-xs">
                                                    {formatTriggerType(item.trigger_type)}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 max-w-xs">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                                    {item.open_feedback || <span className="italic text-gray-400">No comment</span>}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                                                >
                                                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} />
                                                </Button>
                                            </td>
                                        </tr>
                                        {expandedId === item.id && (
                                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                <td colSpan={7} className="px-6 py-6">
                                                    <div className="space-y-4 max-w-4xl">
                                                        {item.open_feedback && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-2">Feedback</h4>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {item.open_feedback}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            {item.use_cases && item.use_cases.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-sm font-semibold mb-2">Use Cases</h4>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {item.use_cases.map((useCase) => (
                                                                            <Badge key={useCase} variant="outline">
                                                                                {formatTriggerType(useCase)}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {item.pain_points && item.pain_points.length > 0 && (
                                                                <div>
                                                                    <h4 className="text-sm font-semibold mb-2">Pain Points</h4>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {item.pain_points.map((point) => (
                                                                            <Badge key={point} variant="outline" className="border-red-300 dark:border-red-800">
                                                                                {formatTriggerType(point)}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {item.feature_ratings && (
                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-2">Feature Ratings</h4>
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                    {Object.entries(item.feature_ratings).map(([feature, rating]) => (
                                                                        <div key={feature} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                                                            <p className="text-xs text-gray-500 mb-1">{formatTriggerType(feature)}</p>
                                                                            {renderStars(rating as number)}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                                                            <span>Allow Followup: {item.allow_followup ? 'Yes' : 'No'}</span>
                                                            {item.page_url && (
                                                                <a href={item.page_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-500">
                                                                    Page URL <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
