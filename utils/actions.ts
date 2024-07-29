import db from '@/utils/db';
import { redirect } from 'next/navigation';

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
