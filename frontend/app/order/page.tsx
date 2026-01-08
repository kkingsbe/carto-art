import { getMarginAdjustedVariants } from '@/lib/actions/ecommerce';
import { OrderPageClient } from '@/components/ecommerce/OrderPageClient';

export const metadata = {
    title: 'Order Print | Carto Art',
    description: 'Order a museum-quality framed print of your map design.',
};

export default async function OrderPage() {
    // Fetch variants on the server
    const variants = await getMarginAdjustedVariants();

    return <OrderPageClient variants={variants} />;
}
