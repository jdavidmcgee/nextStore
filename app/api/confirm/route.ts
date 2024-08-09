import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
import { redirect } from 'next/navigation';

import { type NextRequest } from 'next/server';
import db from '@/utils/db';

export const GET = async (req: NextRequest) => {
	const { searchParams } = new URL(req.url); // access the query parameters - looking for the session_id
	const session_id = searchParams.get('session_id') as string;

	try {
        // let's access the session object from Stripe
		const session = await stripe.checkout.sessions.retrieve(session_id);
		// console.log(session);

		const orderId = session.metadata?.orderId;
		const cartId = session.metadata?.cartId;

		if (session.status === 'complete') {
            // update the order to isPaid = true
			await db.order.update({
				where: {
					id: orderId,
				},
				data: {
					isPaid: true,
				},
			});
            // delete the existing cart instance
			await db.cart.delete({
				where: {
					id: cartId,
				},
			});
		}
	} catch (err) {
		console.log(err);
		return Response.json(null, {
			status: 500,
			statusText: 'Internal Server Error',
		});
	}
	redirect('/orders');
};
