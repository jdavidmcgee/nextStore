import { LuUser2 } from 'react-icons/lu';
import { currentUser, auth } from '@clerk/nextjs/server';
import Image from 'next/image';

async function UserIcon() {
  // if we need to grab the user id, this is how we do it
  //const {userId} = auth()

  const user = await currentUser();

  const profileImage = user?.imageUrl;

  if (profileImage) {
    return (
			<Image
				src={profileImage}
				alt="User profile"
        width={24}
        height={24}
				className="rounded-full object-cover"
			/>
		);
  }
  // if (profileImage) {
  //   return <img src={profileImage} alt="User profile" className='w-6 h-6 rounded-full object-cover' />;
  // }


	return <LuUser2 className="w-6 h-6 bg-primary rounded-full text-white" />;;
}

export default UserIcon;
