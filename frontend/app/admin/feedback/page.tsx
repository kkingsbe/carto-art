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
    ExternalLink,
    Tag,
    Clock,
    CheckCircle2,
    AlertCircle,
    Archive,
    Save
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    BarChart,
    Bar
} from 'recharts';

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
    status: 'new' | 'investigating' | 'in_progress' | 'completed' | 'archived';
    admin_category: string | null;
    admin_notes: string | null;
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
    status_breakdown: Record<string, number>;
}

interface FeedbackTrend {
    date: string;
    rating: number;
    nps: number | null;
    count: number;
}

const STATUS_OPTIONS = [
    { value: 'new', label: 'New', icon: AlertCircle, color: 'text-blue-500 bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' },
    { value: 'investigating', label: 'Investigating', icon: Search, color: 'text-purple-500 bg-purple-50 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' },
    { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-yellow-500 bg-yellow-50 border-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' },
    { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-500 bg-green-50 border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' },
    { value: 'archived', label: 'Archived', icon: Archive, color: 'text-gray-500 bg-gray-50 border-gray-100 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800' },
];

const CATEGORIES = [
    'Bug',
    'Feature Request',
    'UX Suggestion',
    'Data Issue',
    'Pricing',
    'General Praise',
    'Other'
];

export default function FeedbackPage() {
    const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [trend, setTrend] = useState<FeedbackTrend[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [timeRange, setTimeRange] = useState('30d');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [triggerTypeFilter, setTriggerTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    useEffect(() => {
        fetchFeedback();
    }, [timeRange, ratingFilter, triggerTypeFilter, statusFilter, categoryFilter]);

    const fetchFeedback = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                timeRange,
                rating: ratingFilter,
                triggerType: triggerTypeFilter,
                status: statusFilter,
                category: categoryFilter,
                search: searchQuery,
            });

            const res = await fetch(`/api/admin/feedback?${params}`);
            if (res.ok) {
                const data = await res.json();
                setFeedback(data.feedback);
                setStats(data.stats);
                setTrend(data.trend || []);
            } else {
                toast.error('Failed to load feedback');
            }
        } catch (error) {
            toast.error('Failed to load feedback');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateFeedback = async (id: string, updates: Partial<FeedbackItem>) => {
        setIsUpdating(id);
        try {
            const res = await fetch(`/api/admin/feedback/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (res.ok) {
                setFeedback((prev: FeedbackItem[]) => prev.map((item: FeedbackItem) => item.id === id ? { ...item, ...updates } : item));
                toast.success('Feedback updated');

            } else {
                toast.error('Failed to update feedback');
            }
        } catch (error) {
            toast.error('Error updating feedback');
        } finally {
            setIsUpdating(null);
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
                <Badge className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 gap-1 font-medium">
                    <ThumbsUp className="w-3 h-3" />
                    {score}
                </Badge>
            );
        }
        if (category === 'passive') {
            return (
                <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800 gap-1 font-medium">
                    <Minus className="w-3 h-3" />
                    {score}
                </Badge>
            );
        }
        return (
            <Badge className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 gap-1 font-medium">
                <ThumbsDown className="w-3 h-3" />
                {score}
            </Badge>
        );
    };

    const getStatusBadge = (status: string) => {
        const option = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
        const Icon = option.icon;
        return (
            <Badge className={`${option.color} gap-1.5 font-medium`}>
                <Icon className="w-3.5 h-3.5" />
                {option.label}
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
        <div className="space-y-8 pb-12">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">User Feedback</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Review submissions, track status, and categorize user sentiment.
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Feedback</p>
                            <p className="text-2xl font-bold mt-1">{stats?.total || 0}</p>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating</p>
                            <p className="text-2xl font-bold mt-1">{stats?.average_rating.toFixed(1) || '0.0'}</p>
                        </div>
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400">
                            <Star className="w-6 h-6" />
                        </div>
                    </div>
                    <div className="mt-2">
                        {stats && renderStars(Math.round(stats.average_rating))}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">NPS Score</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl font-bold mt-1">{stats?.nps_percentage || 0}</p>
                                <span className={`text-xs ${stats && stats.nps_percentage > 30 ? 'text-green-500' : 'text-yellow-500'}`}>
                                    {stats && stats.nps_percentage > 0 ? 'Good' : 'Needs Improvement'}
                                </span>
                            </div>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        {stats?.total_with_nps || 0} responses
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">NPS Breakdown</p>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400">
                            <Users className="w-6 h-6" />
                        </div>
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

            {/* Charts Section */}
            {trend.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Rating Trend */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-6">Rating Trend</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trend}>
                                    <defs>
                                        <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis
                                        domain={[0, 5]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="rating"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorRating)"
                                        name="Avg Rating"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Volume Trend */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-6">Feedback Volume</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        allowDecimals={false}
                                    />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="#8b5cf6"
                                        radius={[4, 4, 0, 0]}
                                        name="Submissions"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        className="pl-10"
                        placeholder="Search feedback or admin notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Time range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="all">All time</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {STATUS_OPTIONS.map(opt => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {CATEGORIES.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={ratingFilter} onValueChange={setRatingFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All ratings</SelectItem>
                            <SelectItem value="high">High (4-5★)</SelectItem>
                            <SelectItem value="low">Low (1-2★)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={handleSearch} variant="secondary">
                        Apply
                    </Button>
                </div>
            </div>

            {/* Feedback Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rating</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trigger</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Feedback</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {feedback.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        {isLoading ? (
                                            <div className="flex flex-col items-center gap-2">

                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                <p className="text-sm">Loading submissions...</p>
                                            </div>
                                        ) : (
                                            <>
                                                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                                                <p>No feedback found.</p>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                feedback.map((item: FeedbackItem) => (
                                    <Fragment key={item.id}>

                                        <tr
                                            className={`group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${expandedId === item.id ? 'bg-gray-50/50 dark:bg-gray-800/20' : ''}`}
                                        >
                                            <td className="px-6 py-4">
                                                {getStatusBadge(item.status)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                                                        {item.avatar_url ? (
                                                            <img src={item.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Users className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="text-sm min-w-0">
                                                        {item.username ? (
                                                            <>
                                                                <div className="font-medium truncate max-w-[120px]">{item.display_name || item.username}</div>
                                                                <div className="text-xs text-gray-500 truncate">@{item.username}</div>
                                                            </>
                                                        ) : (
                                                            <div className="text-gray-500 italic">Anonymous</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-1">
                                                    {renderStars(item.overall_rating)}
                                                    {item.nps_score !== null && (
                                                        <div className="scale-75 origin-left">
                                                            {getNPSBadge(item.nps_score)}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {item.admin_category ? (
                                                    <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800/50">
                                                        {item.admin_category}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Uncategorized</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="secondary" className="text-xs font-normal">
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
                                                    className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                                >
                                                    <ChevronDown className={`w-4 h-4 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} />
                                                </Button>
                                            </td>
                                        </tr>
                                        {expandedId === item.id && (
                                            <tr className="bg-gray-50/50 dark:bg-gray-800/20">
                                                <td colSpan={8} className="px-6 py-8 border-t border-gray-100 dark:border-gray-800">
                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                                        {/* User Feedback Detail */}
                                                        <div className="lg:col-span-2 space-y-6">
                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                                    <MessageSquare className="w-4 h-4 text-blue-500" />
                                                                    User Submission
                                                                </h4>
                                                                <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                                                                    {item.open_feedback ? (
                                                                        <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                                                            "{item.open_feedback}"
                                                                        </p>
                                                                    ) : (
                                                                        <p className="text-sm text-gray-400 italic">User provided no open feedback.</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                {item.use_cases && item.use_cases.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Use Cases</h4>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {item.use_cases.map((useCase: string) => (
                                                                                <Badge key={useCase} variant="secondary">

                                                                                    {formatTriggerType(useCase)}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {item.pain_points && item.pain_points.length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pain Points</h4>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {item.pain_points.map((point: string) => (
                                                                                <Badge key={point} variant="outline" className="border-red-200 text-red-700 bg-red-50 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/50">

                                                                                    {formatTriggerType(point)}
                                                                                </Badge>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {item.feature_ratings && (
                                                                <div>
                                                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Feature Satistfaction</h4>
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                                        {Object.entries(item.feature_ratings).map(([feature, rating]) => (
                                                                            <div key={feature} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg p-3 shadow-sm">
                                                                                <p className="text-xs text-gray-500 mb-1">{formatTriggerType(feature)}</p>
                                                                                {renderStars(rating as number)}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            <div className="flex items-center gap-6 text-xs text-gray-500 pt-4 border-t border-gray-100 dark:border-gray-800">
                                                                <div className="flex items-center gap-1.5">
                                                                    <CheckCircle2 className={`w-3.5 h-3.5 ${item.allow_followup ? 'text-green-500' : 'text-gray-300'}`} />
                                                                    Allow Followup: {item.allow_followup ? 'Yes' : 'No'}
                                                                </div>
                                                                {item.page_url && (
                                                                    <a href={item.page_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
                                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                                        Source Page
                                                                    </a>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Management Controls */}
                                                        <div className="space-y-6 lg:border-l lg:pl-10 lg:border-gray-200 lg:dark:border-gray-800">
                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                                                    <Tag className="w-4 h-4 text-purple-500" />
                                                                    Categorization
                                                                </h4>

                                                                <div className="space-y-4">
                                                                    <div>
                                                                        <label className="text-xs text-gray-500 block mb-1.5 font-medium uppercase tracking-wider">Status</label>
                                                                        <Select
                                                                            value={item.status}
                                                                            onValueChange={(val) => handleUpdateFeedback(item.id, { status: val as any })}
                                                                            disabled={isUpdating === item.id}
                                                                        >
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {STATUS_OPTIONS.map((opt: any) => (
                                                                                    <SelectItem key={opt.value} value={opt.value}>

                                                                                        <div className="flex items-center gap-2">
                                                                                            <opt.icon className="w-4 h-4" />
                                                                                            {opt.label}
                                                                                        </div>
                                                                                    </SelectItem>
                                                                                ))}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>

                                                                    <div>
                                                                        <label className="text-xs text-gray-500 block mb-1.5 font-medium uppercase tracking-wider">Category</label>
                                                                        <Select
                                                                            value={item.admin_category || 'none'}
                                                                            onValueChange={(val) => handleUpdateFeedback(item.id, { admin_category: val === 'none' ? null : val })}
                                                                            disabled={isUpdating === item.id}
                                                                        >
                                                                            <SelectTrigger className="w-full">
                                                                                <SelectValue placeholder="Select category" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="none">Uncategorized</SelectItem>
                                                                                {CATEGORIES.map((cat: string) => (
                                                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                                                ))}
                                                                            </SelectContent>

                                                                        </Select>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div>
                                                                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-yellow-500" />
                                                                    Internal Notes
                                                                </h4>
                                                                <div className="space-y-3">
                                                                    <Textarea
                                                                        placeholder="Add internal notes about this feedback..."
                                                                        className="min-h-[120px] text-sm resize-none"
                                                                        defaultValue={item.admin_notes || ''}
                                                                        onBlur={(e) => {
                                                                            if (e.target.value !== (item.admin_notes || '')) {
                                                                                handleUpdateFeedback(item.id, { admin_notes: e.target.value });
                                                                            }
                                                                        }}
                                                                        disabled={isUpdating === item.id}
                                                                    />
                                                                    <div className="text-[10px] text-gray-400 flex items-center gap-1 italic">
                                                                        <Save className="w-3 h-3" />
                                                                        Saves automatically on blur
                                                                    </div>
                                                                </div>
                                                            </div>
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

