import { PlaygroundLayout } from '@/components/developer/playground/PlaygroundLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'API Playground | Carto-Art Developer',
    description: 'Interactive API playground to test map generation.'
};

export default function PlaygroundPage() {
    return (
        <div className="h-full">
            <PlaygroundLayout />
        </div>
    );
}
