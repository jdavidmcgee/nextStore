import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Prisma } from '@prisma/client';

// this is another way to access the field names using Prisma!
//const name2 = Prisma.ProductScalarFieldEnum.price; // price
//console.log(`🙏 ~ file: PriceInput.tsx:6 ~ name2:`, name2)

const name = 'price';
type FormInputNumberProps = {
  defaultValue?: number;
};

function PriceInput({ defaultValue }: FormInputNumberProps) {
  return (
		<div className="mb-2">
			<Label htmlFor="price" className="capitalize">
				Price ($)
			</Label>
			<Input
				className="mt-1"
				id={name}
				type="number"
				name={name}
				min={0}
				defaultValue={defaultValue || 100}
				required
			/>
		</div>
  );
}
export default PriceInput;