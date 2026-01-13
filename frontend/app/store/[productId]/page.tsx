
import { getMarginAdjustedVariants, getProducts } from '@/lib/actions/ecommerce';
import { ProductDetailClient } from '@/components/store/ProductDetailClient';
import { groupVariantsByProduct } from '@/lib/utils/store';
import { notFound } from 'next/navigation';

interface ProductDetailPageProps {
    params: {
        productId: string;
    };
}

export const metadata = {
    title: 'Customize Order | Carto Art',
    description: 'Select size and frame options for your print. Available in multiple sizes from small to large format.',
    openGraph: {
        title: 'Customize Your Order - Carto-Art',
        description: 'Select size, frame, and finish options for your custom map poster.',
        locale: 'en_US',
        type: 'website',
        images: [
            {
                url: '/hero.jpg',
                width: 1200,
                height: 630,
                alt: 'Carto-Art - Customize Your Map Poster Order',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Customize Your Order - Carto-Art',
        description: 'Select size, frame, and finish options for your custom map poster.',
        images: ['/hero.jpg'],
    },
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    // Navigate params is a Promise in Next.js 15
    const { productId } = await params;
    const [allVariants, productsData] = await Promise.all([
        getMarginAdjustedVariants(),
        getProducts()
    ]);
    const products = groupVariantsByProduct(allVariants, productsData);

    const productIdInt = parseInt(productId);
    if (isNaN(productIdInt)) {
        return notFound();
    }

    const product = products.find(p => p.id === productIdInt);

    if (!product) {
        return notFound();
    }

    return (
        <ProductDetailClient
            variants={product.variants}
            product={product}
        />
    );
}
