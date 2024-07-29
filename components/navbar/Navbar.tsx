import React from 'react';
import Container from '../global/Container';
import Logo from './Logo';
import NavSearch from './NavSearch';
import CartButton from './CartButton';
import DarkMode from './DarkMode';
import LinksDropdown from './LinksDropdown';
import { Suspense } from 'react';
//Reading search parameters through useSearchParams() without a Suspense boundary will opt the entire page into client-side rendering. This could cause your page to be blank until the client-side JavaScript has loaded.
//Ensure that calls to useSearchParams() are wrapped in a Suspense boundary.

function Navbar() {
	return (
		<nav className="border-b">
			<Container className="flex flex-col sm:flex-row sm: justify-between sm:items-center gap-4 flex-wrap py-8">
				<Logo />
				<Suspense>
					<NavSearch />
				</Suspense>
				<div className="flex gap-4 items-center">
					<CartButton />
					<DarkMode />
					<LinksDropdown />
				</div>
			</Container>
		</nav>
	);
}

export default Navbar;
