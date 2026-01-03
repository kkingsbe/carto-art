import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KeyManager } from '@/components/developer/KeyManager';

export default async function DeveloperDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/auth/login?next=/developer/dashboard');
    }

    return (
        <div className="container mx-auto py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Developer Dashboard</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Manage your API keys and monitor usage.
                </p>

                <section className="mb-12">
                    <KeyManager />
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">Usage Analytics</h2>
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-center text-gray-500">
                        Analytics visualization coming soon.
                    </div>
                </section>
            </div>
        </div>
    );
}
