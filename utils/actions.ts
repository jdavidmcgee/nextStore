'use server';

import db from '@/utils/db';
import { currentUser, auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import {
	imageSchema,
	productSchema,
	validateWithZodSchema,
	reviewSchema,
} from './schemas';
import { deleteImage, uploadImage } from './supabase';
import { revalidatePath } from 'next/cache';
import { Cart } from '@prisma/client';

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

// Favorite actions

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

// Review actions

export const createReviewAction = async (
	prevState: any,
	formData: FormData
) => {
	const user = await getAuthUser(); // only authenticated users can leave a review (not admin users only)
	try {
		const rawData = Object.fromEntries(formData);

		const validatedFields = validateWithZodSchema(reviewSchema, rawData);

		await db.review.create({
			data: {
				...validatedFields, // this is the validated form data an object...so we can spread it here
				clerkId: user.id, // we are adding the user id to the review
			},
		});
		revalidatePath(`/products/${validatedFields.productId}`); // to see the latest changes immediately
		return { message: 'Review submitted successfully' };
	} catch (error) {
		return renderError(error);
	}
};

export const fetchProductReviews = async (productId: string) => {
	const reviews = await db.review.findMany({
		where: {
			productId,
		},
		orderBy: {
			createdAt: 'desc',
		},
	});
	return reviews;
};

export const fetchProductRating = async (productId: string) => {
	const result = await db.review.groupBy({
		by: ['productId'],
		_avg: {
			rating: true,
		},
		_count: {
			rating: true,
		},
		where: {
			productId,
		},
	});

	// empty array if no reviews
	return {
		rating: result[0]?._avg.rating?.toFixed(1) ?? 0,
		count: result[0]?._count.rating ?? 0,
	};
};

export const fetchProductReviewsByUser = async () => {
	const user = await getAuthUser();
	const reviews = await db.review.findMany({
		where: {
			clerkId: user.id,
		},
		select: {
			id: true,
			rating: true,
			comment: true,
			product: {
				select: {
					image: true,
					name: true,
				},
			},
		},
	});
	return reviews;
};

// using the bind method here...we are passing the reviewId to the function
export const deleteReviewAction = async (prevState: { reviewId: string }) => {
	const { reviewId } = prevState;
	const user = await getAuthUser();

	try {
		await db.review.delete({
			where: {
				id: reviewId,
				clerkId: user.id,
			},
		});

		revalidatePath('/reviews');
		return { message: 'Review deleted successfully' };
	} catch (error) {
		return renderError(error);
	}
};

// the result we are looking for is 'null' if the action returns a value that means the user has already left a review for the product.  If the result is 'null', it means the user has not left a review for the product yet.
export const findExistingReview = async (userId: string, productId: string) => {
	return db.review.findFirst({
		where: {
			clerkId: userId,
			productId,
		},
	});
};

// Cart actions:
// helper functions:

export const fetchCartItems = async () => {
	const { userId } = auth(); // we are purposely not using the 'getAuthUser' function here because we want to check if the user is logged in or not.  This can be undefined if there is no user.  We are using the 'auth' function from the Clerk SDK to get the user id

	const cart = await db.cart.findFirst({
		where: {
			clerkId: userId ?? '', // we are using the '??' operator to check if the user id is undefined.  If it is, we'll pass an empty string
		},
		select: {
			numItemsInCart: true,
		},
	});
	return cart?.numItemsInCart || 0;
};

const fetchProduct = async (productId: string) => {
	const product = await db.product.findUnique({
		where: {
			id: productId,
		},
	});

	if (!product) {
		throw new Error('Product not found');
	}
	return product;
};

const includeProductClause = {
	cartItems: {
		include: {
			product: true,
		},
	},
};

export const fetchOrCreateCart = async ({
	userId,
	errorOnFailure = false,
}: {
	userId: string;
	errorOnFailure?: boolean;
}) => {
	let cart = await db.cart.findFirst({
		where: {
			clerkId: userId,
		},
		include: includeProductClause,
	});

	if (!cart && errorOnFailure) {
		throw new Error('Cart not found');
	}

	if (!cart) {
		cart = await db.cart.create({
			data: {
				clerkId: userId,
			},
			include: includeProductClause,
		});
	}

	return cart;
};

const updateOrCreateCartItem = async ({
	productId,
	cartId,
	amount,
}: {
	productId: string;
	cartId: string;
	amount: number;
}) => {
	let cartItem = await db.cartItem.findFirst({
		where: {
			productId,
			cartId,
		},
	});
	// if cartItem exists, we'll update the amount, otherwise we'll create a new cart item
	if (cartItem) {
		cartItem = await db.cartItem.update({
			where: {
				id: cartItem.id,
			},
			data: {
				amount: cartItem.amount + amount, // if the cartItem exists, we'll add the new amount to the existing amount
			},
		});
	} else {
		cartItem = await db.cartItem.create({
			data: { amount, productId, cartId },
		});
	}
};

// main cart actions

export const updateCart = async (cart: Cart) => {
	// the first thing we want to do is to get all the cart items that are in the user's cart
	const cartItems = await db.cartItem.findMany({
		where: {
			cartId: cart.id,
		},
		include: {
			product: true, // Include the related product
		},
		orderBy: {
			createdAt: 'asc',
		},
	});
	// in prisma you can't do aggregations if you have two models connected.  So we'll do the aggregation in the code

	let numItemsInCart = 0;
	let cartTotal = 0;

	// with the approach we take below, getting the product price data from the database, if the product price changes, the cart total will be updated automatically
	for (const item of cartItems) {
		numItemsInCart += item.amount;
		cartTotal += item.amount * item.product.price;
	}
	const tax = cart.taxRate * cartTotal;
	const shipping = cartTotal ? cart.shipping : 0; // if the cart total is 0, we'll set the shipping to 0
	const orderTotal = cartTotal + tax + shipping;

	const currentCart = await db.cart.update({
		where: {
			id: cart.id,
		},
		data: {
			numItemsInCart,
			cartTotal,
			tax,
			orderTotal,
		},
		include: includeProductClause,
	});
	return { currentCart, cartItems };
};

export const addToCartAction = async (prevState: any, formData: FormData) => {
	// we can only add to cart if the user is authenticated
	const user = await getAuthUser();
	const productId = formData.get('productId') as string;
	const amount = Number(formData.get('amount'));
	// we want to get the price from the database - not the front end. It will be safer and more secure.  We also want to check that the product exists.
	await fetchProduct(productId);
	// every user will have one cart.  At this point we don't know if there is a cart instance or not.  We'll check if there is a cart instance for the user.  If there is, we'll update the cart, otherwise we'll create a new cart instance.
	const cart = await fetchOrCreateCart({ userId: user.id });
	// we will create a new cart item or, if the cart item already exists, we'll update the amount
	await updateOrCreateCartItem({ productId, cartId: cart.id, amount });
	// the last step is to update the cart.
	await updateCart(cart); // 'cart' is the one we fetched or created

	try {
	} catch (error) {
		return renderError(error);
	}
	redirect('/cart');
};

export const removeCartItemAction = async (
	prevState: any,
	formData: FormData
) => {
	const user = await getAuthUser(); // we can't complete this action unless there is a valid user
	try {
		const cartItemId = formData.get('id') as string;
		const cart = await fetchOrCreateCart({
			userId: user.id,
			errorOnFailure: true, // if we are trying to remove an item from a cart that doesn't exist, we'll throw an error
		});
		await db.cartItem.delete({
			// we want to delete the cart item that matches the cartItemId and the cartId, otherwise we'll get an error
			where: {
				id: cartItemId,
				cartId: cart.id,
			},
		});

		await updateCart(cart);
		revalidatePath('/cart');
		return { message: 'Item removed from cart' };
	} catch (error) {
		return renderError(error);
	}
};

// this is very similar to the removeCartItemAction function above.  The only difference is that we are updating the amount of the cart item instead of deleting it.  We aren't passing this to the form container..but to the function handleChange...so the arguments are different.
export const updateCartItemAction = async ({
	amount, // think 'new amount'
	cartItemId,
}: {
	amount: number;
	cartItemId: string;
}) => {
	const user = await getAuthUser();

	try {
		const cart = await fetchOrCreateCart({
			userId: user.id,
			errorOnFailure: true,
		});
		await db.cartItem.update({
			where: {
				id: cartItemId,
				cartId: cart.id,
			},
			data: {
				amount,
			},
		});
		await updateCart(cart);
		revalidatePath('/cart');
		return { message: 'cart updated' };
	} catch (error) {
		return renderError(error);
	}
};

// Order actions
export const createOrderAction = async (prevState: any, formData: FormData) => {
	const user = await getAuthUser();
	// the reason we have these variables coded here is because we can not call redirect in a try/catch block.  We store them here and reassign the values in the try block...then we can use them in the redirect function outside the try block
	let orderId: null | string = null;
	let cartId: null | string = null;

	try {
		// a lot of the data is coming from the cart, so the first thing we want to do is to get the cart
		const cart = await fetchOrCreateCart({
			userId: user.id,
			errorOnFailure: true,
		});

		cartId = cart.id;

		// we want to remove all the orders where the isPaid is false.  Once we add the payment getaway, user will be able to abandon the cart.  However we will still create the order instance.  We'll just set the isPaid to false.  We'll remove all the orders where the isPaid is false.  We will now only have an instance where isPaid is true.
		await db.order.deleteMany({
			where: {
				isPaid: false,
				clerkId: user.id,
			},
		});

		// creating our order instance
		const order = await db.order.create({
			data: {
				clerkId: user.id,
				products: cart.numItemsInCart,
				orderTotal: cart.orderTotal,
				tax: cart.tax,
				shipping: cart.shipping,
				email: user.emailAddresses[0].emailAddress,
			},
		});

		// we then want to delete the cart and all the cart items, eventually we'll do this in a different place (once the order is paid for)...this is why it is commented out
		// await db.cart.delete({
		// 	where: {
		// 		id: cart.id,
		// 	},
		// });
		orderId = order.id;
	} catch (error) {
		return renderError(error);
	}
	// redirect('/orders');
	redirect(`/checkout?orderId=${orderId}&cartId=${cartId}`);
};

// in this action we are fetching the user's orders.  We are using the 'getAuthUser' function to get the user.  We are then using the user id to get the orders from the database.  We are also ordering the orders by the date they were created in descending order.
export const fetchUserOrders = async () => {
	const user = await getAuthUser();
	const orders = await db.order.findMany({
		where: {
			clerkId: user.id,
			isPaid: true,
		},
		orderBy: {
			createdAt: 'desc',
		},
	});
	return orders;
};

// this is for the admin to get the orders...
export const fetchAdminOrders = async () => {
	const user = await getAdminUser();
	// another way to handle this is to just invoke the getAdminUser function and not assign it to a variable so:
	//await getAdminUser();

	const orders = await db.order.findMany({
		where: {
			isPaid: true,
		},
		orderBy: {
			createdAt: 'desc',
		},
	});
	return orders;
};
