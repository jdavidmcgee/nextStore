'use server';

import db from '@/utils/db';
import { currentUser, auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { productSchema, validateWithZodSchema } from './schemas';

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
		const rawData = Object.fromEntries(formData); // instead of using formData.get('name') as string, we can use this method to get all the form data
		//console.log(`🙏 ~ file: actions.ts:83 ~ rawData:`, rawData)
		//const validatedFields = productSchema.parse(rawData); // this is how we validate the form data - however to access the validation error messages from ZOD we need to do something else - we need to use safeParse!

		// this was the next way John used to validate the form data..but felt it would be better, especially if we have lots of other actions (CRUD) we could create a generic function to handle the validation.  We placed this in the schemas.ts file
		const validatedFields = validateWithZodSchema(productSchema, rawData);

		// we can now create the instance of the product
		await db.product.create({
			data: {
				...validatedFields, // this is the validated form data an object...so we can spread it here
				image: '/images/desk.jpg',
				clerkId: user.id,
			},
		});

		return { message: 'product created' };
	} catch (error) {
		return renderError(error);
	}
};
