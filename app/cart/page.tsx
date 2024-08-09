import CartItemsList from '@/components/cart/CartItemsList';
import CartTotals from '@/components/cart/CartTotals';
import SectionTitle from '@/components/global/SectionTitle';
import { fetchOrCreateCart, updateCart } from '@/utils/actions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';


async function CartPage() {
	const { userId } = auth();
	if (!userId) redirect('/'); // if the user is not logged in, redirect them to the home page

	const previousCart = await fetchOrCreateCart({ userId });
	const { cartItems, currentCart } = await updateCart(previousCart); // we update the cart to get the latest cart items and totals so if something changes (like a price is adjusted) we can reflect that in the cart page.  This won't happen automatically, only if the page is refreshed.

	if (currentCart.numItemsInCart === 0) {
		return <SectionTitle text="Empty cart" />;
	}
	return (
		<>
			<SectionTitle text="Shopping Cart" />
			<div className="mt-8 grid gap-4 lg:grid-cols-12">
				<div className="lg:col-span-8">
					<CartItemsList cartItems={cartItems} />
				</div>
				<div className="lg:col-span-4 lg:pl-4">
					<CartTotals cart={currentCart} />
				</div>
			</div>
		</>
	);
}
export default CartPage;
