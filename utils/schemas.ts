import { z, ZodSchema } from 'zod';

export const productSchema1 = z.object({
	name: z.string().min(4).max(30), // min and max are used to set the length of the string
	company: z.string().min(4), // min is used to set the minimum length of the string
	price: z.coerce.number().int().min(0), // coerce will convert a string to a number
	description: z.string(), // this is a string
	featured: z.coerce.boolean(), // coerce will convert a string to a boolean
});

// the following is a more detailed schema where we can add error messages if the data does not meet the requirements and pass validation.  It is better than the above schema because it is more detailed and will give better error messages.

export const productSchema = z.object({
	name: z
		.string()
		.min(5, {
			message: 'name must be at least 5 characters.',
		})
		.max(30, {
			message: 'name must be less than 30 characters.',
		}),
	company: z.string(),
	featured: z.coerce.boolean(),
	price: z.coerce.number().int().min(0, {
		message: 'price must be a positive number.',
	}),
	description: z.string().refine(
		description => {
			const wordCount = description.split(' ').length; // this will count the number of words in the description
			return wordCount >= 10 && wordCount <= 1000; // this will return true if the word count is between 10 and 1000
		},
		{
			message: 'description must be between 10 and 1000 words.',
		}
	),
});

// this is a generic function that will validate the data against the schema and return the data if it is valid.  If it is not valid, it will throw an error with the error messages.  This is a generic so we could have multiple schemas and use this function to validate the data against any of them.  we will return a type of T

export function validateWithZodSchema<T>(
	schema: ZodSchema<T>,
	data: unknown
): T {
	const result = schema.safeParse(data);
	if (!result.success) {
		const errors = result.error.errors.map(error => error.message);
		throw new Error(errors.join(', '));
	}
	return result.data;  // returning result.data will return the data if it is valid.  if we had only returned the 'result' then we would have returned the entire object which would have included the 'success' and 'error' properties...so we'd have to access the 'data' property to get the data in another function.
}

// let's set up a schema for images as well as validating the image size and type
// John kept the image as a object...to keep it consistent with the other schemas.  

export const imageSchema = z.object({
	image: validateImageFile(),
});

function validateImageFile() {
	const maxUploadSize = 1024 * 1024; // this is 1 MB
	const acceptedFileTypes = ['image/'];
	return z
		.instanceof(File) // this will check if the file is an instance of the File object
		.refine(file => { // this will check if the file size is less than 1 MB
			return !file || file.size <= maxUploadSize;
		}, `File size must be less than 1 MB`)
		.refine(file => { // this will check if the file is an image
			return (
				!file || acceptedFileTypes.some(type => file.type.startsWith(type))
			);
		}, 'File must be an image');
}
