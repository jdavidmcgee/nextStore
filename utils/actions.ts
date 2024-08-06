'use server';

import db from '@/utils/db';
import { currentUser, auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { imageSchema, productSchema, validateWithZodSchema } from './schemas';
import { deleteImage, uploadImage } from './supabase';
import { revalidatePath } from 'next/cache';

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

// another helper function to get the admin users
const getAdminUser = async () => {
	const user = await getAuthUser();
	if (user.id !== process.env.ADMIN_USER_ID) redirect('/'); // if the user is not the admin, redirect to the home page
	return user; // if everything is okay, return the user
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
		const rawData = Object.fromEntries(formData);
		const file = formData.get('image') as File; // this is the image file
		const validatedFields = validateWithZodSchema(productSchema, rawData);
		const validatedFile = validateWithZodSchema(imageSchema, { image: file });
		//console.log(`🙏 ~ file: actions.ts:87 ~ validateFile:`, validatedFile)
		const fullPath = await uploadImage(validatedFile.image);

		// we can now create the instance of the product
		await db.product.create({
			data: {
				...validatedFields, // this is the validated form data an object...so we can spread it here
				image: fullPath,
				clerkId: user.id,
			},
		});
	} catch (error) {
		return renderError(error);
	}
	redirect('/admin/products');
};

export const fetchAdminProducts = async () => {
	await getAdminUser();
	const products = await db.product.findMany({
		orderBy: {
			createdAt: 'desc',
		},
	});
	return products;
};

// admin delete product action
// we are using the 'bind' method to pass the 'prevState' object to the function.  The value we set up in bind will be the value of 'prevState' in the function

export const deleteProductAction = async (prevState: { productId: string }) => {
	const { productId } = prevState;
	await getAdminUser();

	try {
		const product = await db.product.delete({
			where: {
				id: productId,
			},
		});
		await deleteImage(product.image);
		// the revalidatePath function is used to revalidate the cache of the path we are deleting the product from so we can see the changes immediately
		revalidatePath('/admin/products');
		return { message: 'product removed' };
	} catch (error) {
		return renderError(error);
	}
};

// let's now create the edit product actions
//FetchAdminProductDetails (get), UpdateProductAction (like post) and updateProductImageAction (like post)

export const fetchAdminProductDetails = async (productId: string) => {
	await getAdminUser();
	const product = await db.product.findUnique({
		where: {
			id: productId,
		},
	});
	if (!product) redirect('/admin/products');
	return product;
};

// since we have a hidden input field we don't need to use the bind method to pass the product id to the function...it is already in the form data.  we'll just need to grab it
export const updateProductAction = async (
	prevState: any,
	formData: FormData
) => {
	await getAdminUser();
	try {
		const productId = formData.get('id') as string;
		const rawData = Object.fromEntries(formData); // similar to what we did in createProductAction

		const validatedFields = validateWithZodSchema(productSchema, rawData); // similar to what we did in createProductAction
		// we can now update the product, so we'll use the 'update' method

		await db.product.update({
			where: {
				id: productId,
			},
			data: {
				...validatedFields,
			},
		});
		revalidatePath(`/admin/products/${productId}/edit`); // to see the latest changes immediately
		return { message: 'Product updated successfully' };
	} catch (error) {
		return renderError(error);
	}
};


// since we have a hidden input field we don't need to use the bind method to pass the product id to the this function as well...it is already in the form data.  we'll just need to grab it

export const updateProductImageAction = async (
	prevState: any,
	formData: FormData
) => {
	await getAdminUser();
	try {
		const image = formData.get('image') as File;
		const productId = formData.get('id') as string;
		const oldImageUrl = formData.get('url') as string;

		const validatedFile = validateWithZodSchema(imageSchema, { image });
		const fullPath = await uploadImage(validatedFile.image);
		await deleteImage(oldImageUrl);
		await db.product.update({
			where: {
				id: productId,
			},
			data: {
				image: fullPath,
			},
		});
		revalidatePath(`/admin/products/${productId}/edit`);
		return { message: 'Product Image updated successfully' };
	} catch (error) {
		return renderError(error);
	}
};


// this action below is for the favorite button. We'll need to get the user and the product id to check if the product is already in the user's favorite list
export const fetchFavoriteId = async ({ productId }: { productId: string }) => {
	const user = await getAuthUser();
	const favorite = await db.favorite.findFirst({
		where: {
			productId,
			clerkId: user.id,
		},
		select: {
			id: true,
		},
	});
	return favorite?.id || null;
};



export const toggleFavoriteAction = async (prevState: {
	productId: string;
	favoriteId: string | null;
	pathname: string;
}) => {
	const user = await getAuthUser();
	const { productId, favoriteId, pathname } = prevState; // we are destructuring the prevState object to get the productId, favoriteId and pathname. the prevState object is passed to the function when we bind it in the FavoriteToggleForm component.  We are again using the bind method to pass the prevState object to the function.  The value we set up in bind will be the value of 'prevState' in the function
	try {
		// the the favoriteId exists, we'll delete it, otherwise we'll create it - cause we are toggling the favorite
		if (favoriteId) {
			await db.favorite.delete({
				where: {
					id: favoriteId,
				},
			});
		} else {
			await db.favorite.create({
				data: {
					productId,
					clerkId: user.id,
				},
			});
		}
		revalidatePath(pathname); // to see the latest changes immediately
		return {
			message: favoriteId ? 'Removed from Favorites' : 'Added to Favorites',
		};
	} catch (error) {
		return renderError(error);
	}
};


export const fetchUserFavorites = async () => {
	const user = await getAuthUser();
	const favorites = await db.favorite.findMany({
		where: {
			clerkId: user.id,
		},
		//the 'include' object is used to include the product data in the response, since we've connected the favorite and product tables (models) in the database
		include: {
			product: true,
		},
	});
	return favorites;
};
