//import { Label } from '@/components/ui/label';
//import { Input } from '@/components/ui/input';
import FormInput from '@/components/form/FormInput';
import { SubmitButton } from '@/components/form/Buttons';
import FormContainer from '@/components/form/FormContainer';
import { createProductAction } from '@/utils/actions';
import ImageInput from '@/components/form/ImageInput';
import PriceInput from '@/components/form/PriceInput';
import TextAreaInput from '@/components/form/TextAreaInput';
import { faker } from '@faker-js/faker';
import CheckboxInput from '@/components/form/CheckboxInput';

// const createProductAction = async (formData: FormData) => {
// 	'use server';
// 	const name = formData.get('name') as string; // the 'name' attribute of the input field is 'name' and therefore we use 'name' here.  If we had name='chicken' in the input field, we would use 'chicken' here.
// 	console.log(name);
// };

function CreateProductPage() {
	const fakeName = faker.commerce.productName();
	const fakeCompany = faker.company.name();
	const fakeDescription = faker.lorem.paragraph({ min: 10, max: 12 });
	return (
		<section>
			<h1 className="text-2xl font-semibold mb-8 capitalize">
				create product
			</h1>
			<div className="border p-8 rounded-md">
				<FormContainer action={createProductAction}>
					<div className="grid gap-4 md:grid-cols-2 my-4">
						<FormInput
							type="text"
							name="name"
							label="product name"
							defaultValue={fakeName}
						/>
						<FormInput
							type="text"
							name="company"
							label="company"
							defaultValue={fakeCompany}
						/>
						<PriceInput />
						<ImageInput />
					</div>
					<TextAreaInput
						name="description"
						labelText="product description"
						defaultValue={fakeDescription}
					/>
					<div className="mt-6">
						<CheckboxInput name="featured" label="featured" />
					</div>

					<SubmitButton text="Create Product" className="mt-8" />
				</FormContainer>
			</div>
		</section>
	);
}

export default CreateProductPage;
