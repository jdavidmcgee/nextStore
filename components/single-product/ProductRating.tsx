import { fetchProductRating } from '@/utils/actions';
import { FaStar } from 'react-icons/fa';


async function ProductRating({ productId }: { productId: string }) {
    // temporary rating and count values
	//const rating = 4.2;
	//const count = 25;
	const { rating, count } = await fetchProductRating(productId);

	const className = `flex gap-1 items-center text-md mt-1 mb-4`;
	const countValue = `(${count}) reviews`;
	return (
		<span className={className}>
			<FaStar className="w-3 h-3" />
			{rating} {countValue}
		</span>
	);
}

export default ProductRating;
