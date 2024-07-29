import LoadingContainer from '@/components/global/LoadingContainer';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import Hero from '@/components/home/Hero';
import { Suspense } from 'react';

function HomePage() {
	// do not place the loading files inside of a page where there is a fetch function being fired.  You need to fetch inside of the component...which you will wrap with 'Suspense'
	return (
		<>
			<Hero />
			<Suspense fallback={<LoadingContainer/>}>
				<FeaturedProducts />
			</Suspense>
		</>
	);
}

export default HomePage;
