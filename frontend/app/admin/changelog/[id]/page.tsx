'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ChevronLeft,
    Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
    createChangelogEntry,
    updateChangelogEntry,
    getAllChangelogEntries,
    type ChangelogEntry
} from '@/lib/actions/changelog';
import Link from 'next/link';

export default function ChangelogEditorPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const isNew = id === 'new';

    const [isLoading, setIsLoading] = useState(!isNew);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<ChangelogEntry>>({
        title: '',
        description: '',
        is_published: false,
        published_at: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (!isNew) {
            fetchEntry();
        }
    }, [id]);

    const fetchEntry = async () => {
        try {
            const entries = await getAllChangelogEntries();
            const entry = entries.find(e => e.id === id);
            if (entry) {
                setFormData({
                    title: entry.title,
                    description: entry.description,
                    is_published: entry.is_published,
                    published_at: entry.published_at ? new Date(entry.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
                });
            } else {
                toast.error('Entry not found');
                router.push('/admin/changelog');
            }
        } catch (error) {
            toast.error('Failed to load entry');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (isNew) {
                await createChangelogEntry(formData);
                toast.success('Changelog entry created');
            } else {
                await updateChangelogEntry(id, formData);
                toast.success('Changelog entry updated');
            }
            router.push('/admin/changelog');
            router.refresh();
        } catch (error) {
            toast.error('Failed to save entry');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/admin/changelog">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        {isNew ? 'New Changelog Entry' : 'Edit Changelog Entry'}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6 bg-white dark:bg-gray-900 p-8 border border-gray-200 dark:border-gray-800 rounded-xl">
                <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        placeholder="Feature: New Map Styles"
                        value={formData.title}
                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        placeholder="Describe the new feature or update..."
                        rows={5}
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="published_at">Publish Date</Label>
                        <Input
                            id="published_at"
                            type="date"
                            value={formData.published_at}
                            onChange={e => setFormData(prev => ({ ...prev, published_at: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-lg">
                        <div className="space-y-0.5">
                            <Label>Published Status</Label>
                            <p className="text-xs text-gray-500">
                                {formData.is_published ? 'Visible to public' : 'Draft mode'}
                            </p>
                        </div>
                        <Switch
                            checked={formData.is_published}
                            onCheckedChange={checked => setFormData(prev => ({ ...prev, is_published: checked }))}
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    <Button variant="outline" type="button" onClick={() => router.push('/admin/changelog')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isNew ? 'Create Entry' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
