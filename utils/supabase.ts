import { createClient } from '@supabase/supabase-js';

const bucket = 'main-bucket'; // Name of the bucket you have created in your supabase storage

// Create a single supabase client for interacting with your database
export const supabase = createClient(
	process.env.SUPABASE_URL as string,
	process.env.SUPABASE_KEY as string
);

export const uploadImage = async (image: File) => {
	const timestamp = Date.now();
	// const newName = `/users/${timestamp}-${image.name}`; // upload to a folder called 'users'
	const newName = `${timestamp}-${image.name}`;

	const { data, error } = await supabase.storage
		.from(bucket)
		.upload(newName, image, {
			cacheControl: '3600',
		});
	if (!data) throw new Error('Image upload failed');
	return supabase.storage.from(bucket).getPublicUrl(newName).data.publicUrl; // this will return the public URL of the image
};

// let's create a function to delete an image
export const deleteImage = (url: string) => {
	const imageName = url.split('/').pop();
	if(!imageName) throw new Error('Invalid image URL');
	return supabase.storage.from(bucket).remove([imageName]);
		
}
