import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher(['/', '/products(.*)', '/about']); // these are the public routes, the rest are private and therefore restricted.

export default clerkMiddleware((auth, req) => {
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
