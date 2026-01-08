
import { getMarginAdjustedVariants } from '@/lib/actions/ecommerce';
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
    description: 'Select size and frame options for your print.',
};

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
    // Navigate params is a Promise in Next.js 15
    const { productId } = await params;
    const allVariants = await getMarginAdjustedVariants();
    const products = groupVariantsByProduct(allVariants);

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
            productTitle={product.title}
        />
    );
}
