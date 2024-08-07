import { FaStar, FaRegStar } from 'react-icons/fa';

function Rating({ rating }: { rating: number }) {
	// rating logic used
	// let's say the rating = 2
	// 1 <= 2 true
	// 2 <= 2 true
	// 3 <= 2 false
	// 4 <= 2 false
	// 5 <= 2 false
  // result of stars = [true, true, false, false, false]

	const stars = Array.from({ length: 5 }, (_, i) => i + 1 <= rating);

	return (
		<div className="flex items-center gap-x-1">
      {/* this iterates through the stars array, and for each 'true' value it render a star filled or a start unfilled.  The CSS is what determines this... */}
			{stars.map((isFilled, i) => {
				const className = `w-3 h-3 ${
					isFilled ? 'text-primary' : 'text-gray-400'
				}`;
				return isFilled ? (
					<FaStar className={className} key={i} />
				) : (
					<FaRegStar className={className} key={i} />
				);
			})}
		</div>
	);
}

export default Rating;
