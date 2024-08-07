'use client';
import { useState } from 'react';
import { SubmitButton } from '@/components/form/Buttons';
import FormContainer from '@/components/form/FormContainer';
import { Card } from '@/components/ui/card';
import RatingInput from '@/components/reviews/RatingInput';
import TextAreaInput from '@/components/form/TextAreaInput';
import { Button } from '@/components/ui/button';
import { createReviewAction } from '@/utils/actions';
import { useUser } from '@clerk/nextjs'; // since this is a 'user component' we'll need to import the useUser hook from the clerk package

function SubmitReview({ productId }: { productId: string }) {
	const [isReviewFormVisible, setIsReviewFormVisible] = useState(false); // we are using the useState hook to create a state variable called isReviewFormVisible and a function called setIsReviewFormVisible to update the state variable
	const { user } = useUser(); // we are using the useUser hook to get the user object.  This is public route...there is nothing wrong if it is null or undefined.

	return (
		<div>
			<Button
				size="lg"
				className="capitalize"
				onClick={() => setIsReviewFormVisible(prev => !prev)}>
				leave review
			</Button>
      {/* we only want to run this code if the 'leave review' button is clicked and the user wants to leave a review */}
			{isReviewFormVisible && (
				<Card className="p-8 mt-8">
					<FormContainer action={createReviewAction}>
            {/* we are using hidden fields here instead of the 'bind method' */}
						<input type="hidden" name="productId" value={productId} />
						<input
							type="hidden"
							name="authorName"
							value={user?.firstName || 'user'}
						/>
						<input
							type="hidden"
							name="authorImageUrl"
							value={user?.imageUrl || ''}
						/>
						<RatingInput name="rating" />
						<TextAreaInput
							name="comment"
							labelText="feedback"
							defaultValue="This product is...wonderful."
						/>
						<SubmitButton className="mt-4" />
					</FormContainer>
				</Card>
			)}
		</div>
	);
}

export default SubmitReview;
