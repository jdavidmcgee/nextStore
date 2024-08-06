import Link from 'next/link';
import { Button } from '@/components/ui/button';
import HeroCarousel from './HeroCarousel';

function Hero() {
	return (
		<section className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
			<div>
				<h1 className="max-w-2xl font-bold text-4xl tracking-tight sm:text-6xl">
					Ignite your shopping experience
				</h1>
				<p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">
					Rutters Plate Fleet boom chandler Brethren of the Coast
					handsomely lookout marooned brigantine knave. Buccaneer gangway
					jack rum loot spyglass line Jack Tar fore gaff. 
				</p>
				{/* we use asChild below because the button is being used as a wrapper for the Link component.  If it was a submit button or normal click button we wouldn't have to do this. */}
				<Button asChild size="lg" className="mt-10">
					<Link href="/products">Our Products</Link>
				</Button>
			</div>
			<HeroCarousel />
		</section>
	);
}

export default Hero;
