import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher(['/', '/products(.*)', '/about']); // these are the public routes, the rest are private and therefore restricted.

const isAdminRoute = createRouteMatcher(['/admin(.*)']); // these are the admin routes, the rest are user routes.

export default clerkMiddleware((auth, req) => {
	//console.log(auth().userId); // log the user to the console
	const isAdminUser = auth().userId === process.env.ADMIN_USER_ID; // check if the user is an admin
	// with the paid account you can get access to the user's role and other information.  Since we are using the free account we coded the admin user id in the .env file.

	if (isAdminRoute(req) && !isAdminUser) {
		return NextResponse.redirect(new URL('/', req.url));
	}

	if (!isPublicRoute(req)) auth().protect(); // protect the route if it is not a public route and only the users who are logged in can access it.
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		'/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
		// Always run for API routes
		'/(api|trpc)(.*)',
	],
};
