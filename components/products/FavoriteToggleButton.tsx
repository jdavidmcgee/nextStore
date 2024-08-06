import { FaHeart } from 'react-icons/fa';
import { Button } from '../ui/button';
import { auth } from '@clerk/nextjs/server';
import { CardSignInButton } from '../form/Buttons';
import { fetchFavoriteId } from '@/utils/actions';
import FavoriteToggleForm from './FavoriteToggleForm';

async function FavoriteToggleButton({ productId }: { productId: string }) {
	const {userId} = auth();

	if (!userId) return <CardSignInButton />;
	// if there is no user we will never get to this code below
	const favoriteId = await fetchFavoriteId({ productId });

	return <FavoriteToggleForm favoriteId={favoriteId} productId={productId} />;
}

export default FavoriteToggleButton;
