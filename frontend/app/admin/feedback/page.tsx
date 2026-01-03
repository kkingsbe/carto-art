import { MessageSquare } from 'lucide-react';

export default function FeedbackPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">User Feedback</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Review submissions and satisfaction scores.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 md:p-12 text-center text-gray-500">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                <p>Feedback management interface coming soon.</p>
            </div>
        </div>
    );
}
