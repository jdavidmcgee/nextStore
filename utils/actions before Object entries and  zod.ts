'use server';

import db from '@/utils/db';
import { currentUser, auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

// we have two helper functions here.  One is to render an error and the other is to get the authenticated user

const renderError = (error: unknown): { message: string } => {
	console.log(error);
	return {
		message: error instanceof Error ? error.message : 'An error occurred',
	};
};

const getAuthUser = async () => {
	const user = await currentUser();
	if (!user) {
		//throw new Error('You must be logged in to access this route');
		redirect('/');
	}
	return user;
};

// these are two ways to get data.  One is async/await and the other is a different way

export const fetchFeaturedProducts = async () => {
	const products = await db.product.findMany({
		where: {
			featured: true,
		},
		// this is the way we select various fields
		// select: {
		//     id: true,
		//     name: true,
		//     price: true,
		//     image: true,
		// },
	});
	return products;
};

export const fetchAllProducts = ({ search = '' }: { search: string }) => {
	return db.product.findMany({
		where: {
			OR: [
				{ name: { contains: search, mode: 'insensitive' } },
				{ company: { contains: search, mode: 'insensitive' } },
			],
		},
		// this is the way we select various fields.  the 'desc' is for descending order
		orderBy: {
			createdAt: 'desc',
		},
	});
};

// fetch a single product
export const fetchSingleProduct = async (productId: string) => {
	const product = await db.product.findUnique({
		where: {
			id: productId,
		},
	});
	if (!product) redirect('/products');
	return product;
};

// create product action

export const createProductAction = async (
	prevState: any,
	formData: FormData
): Promise<{ message: string }> => {
	//const user = await currentUser(); // TS is saying that this could also be null
	// to handle it, we can do this:
	// if (!user) {
	// 	return { message: 'You must be logged in to create a product' }; // or we can redirect to login page like this: redirect('/login')
	// }
	const user = await getAuthUser();
	try {
		const name = formData.get('name') as string;
		const company = formData.get('company') as string;
		const price = Number(formData.get('price') as string);
		const description = formData.get('description') as string;
		// this is temporary approach
		const image = formData.get('image') as File;
		const featured = Boolean(formData.get('featured') as string);

		await db.product.create({
			data: {
				name,
				company,
				price,
				description,
				image: '/images/couch.jpg',
				featured,
				clerkId: user.id,
			},
		});
		return { message: 'product created' };
	} catch (error) {
		return renderError(error);
	}
};
