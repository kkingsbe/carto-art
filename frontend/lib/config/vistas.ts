import type { PosterLocation } from '../../types/poster';

export interface Vista {
    name: string;
    description: string;
    location: PosterLocation;
}

export const VISTAS: Vista[] = [
    {
        name: 'Chesapeake Bay',
        description: 'Vintage nautical style showing the vast bay network.',
        location: {
            name: 'Chesapeake Bay',
            city: 'The Chesapeke',
            subtitle: 'United States',
            center: [-76.17419096218805, 37.8593958816429],
            bounds: [[-76.35, 36.75], [-75.75, 37.15]],
            zoom: 7.381973990444137
        }
    },
    {
        name: 'Salt Lake City',
        description: 'Dramatic "Midnight" view of the city between the mountains and the lake.',
        location: {
            name: 'Salt Lake City',
            city: 'Salt Lake City, UT',
            subtitle: 'Utah, United States',
            center: [-111.886797, 40.7596198],
            bounds: [[-112.1013916, 40.6999263], [-111.7404843, 40.8533905]],
            zoom: 10
        }
    },
    {
        name: 'Tucson',
        description: 'A clean "Minimal" look at the Arizona desert city.',
        location: {
            name: 'Tucson',
            city: 'Tucson, AZ',
            subtitle: 'Arizona, United States',
            center: [-110.96359522925843, 32.158429280115655],
            bounds: [[-111.15, 32.05], [-110.75, 32.35]],
            zoom: 9.799049962367631
        }
    },
    {
        name: 'San Francisco Noir',
        description: 'A striking "Dark Mode" view of San Francisco with silver highlights.',
        location: {
            name: 'San Francisco',
            city: 'San Francisco, CA',
            subtitle: 'California, USA',
            center: [-122.4194, 37.7749],
            bounds: [[-122.5179, 37.7038], [-122.3774, 37.8324]],
            zoom: 12
        }
    },
    {
        name: 'The Channel Neon',
        description: 'Vibrant neon glow over the English Channel.',
        location: {
            name: 'The Channel',
            city: 'The Channel',
            subtitle: 'English Channel',
            center: [1.171034135519335, 50.52543799494359],
            bounds: [[-111.15, 32.05], [-110.75, 32.35]], // Note: These bounds seem copied from Tucson in original seed file, might want to fix or keep as is to match legacy behavior
            zoom: 5.805587920440557
        }
    },
    {
        name: 'Organic North America',
        description: 'A vibrant "Organic" style view of the North American continent with coral tones.',
        location: {
            name: '',
            city: 'North America',
            subtitle: '',
            center: [-92.02849409103771, 9.479108070782175],
            bounds: [[-77.1130377, 38.862957], [-77.1128569, 38.8630805]],
            zoom: 1.2854311188678398
        }
    },
    {
        name: 'The Midatlantic',
        description: 'An "Organic" style view of the Midatlantic region with pueblo tones.',
        location: {
            name: 'The Midatlantic',
            city: 'The Midatlantic',
            subtitle: '',
            center: [-76.20066635491213, 38.15458777720772],
            bounds: [[-77.0688043, 39.0140765], [-77.0687043, 39.0141765]],
            zoom: 6.85796882629819
        }
    },
    {
        name: 'North America Botanical',
        description: 'A circular "Watercolor" view of the North American continent with botanical tones.',
        location: {
            name: '',
            city: 'North America',
            subtitle: '',
            center: [-99.53825302507505, 53.34358203851335],
            bounds: [[-77.1130377, 38.862957], [-77.1128569, 38.8630805]],
            zoom: 2.613024419786261
        }
    },
    {
        name: 'Kennedy Space Center',
        description: 'A topographic survey-style view of LC-39B launch complex at Cape Canaveral.',
        location: {
            name: 'Kennedy Space Center',
            city: 'LC-39B',
            subtitle: 'Cape Canaveral, Florida, United States',
            center: [-80.620843347, 28.62686961091171],
            bounds: [[-80.5751454, 28.4377832], [-80.5686859, 28.4463163]],
            zoom: 14
        }
    }
];

export function getRandomVista(): Vista {
    return VISTAS[Math.floor(Math.random() * VISTAS.length)];
}
