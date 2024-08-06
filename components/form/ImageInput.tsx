import { Label } from '../ui/label';
import { Input } from '../ui/input';

function ImageInput() {
	const name = 'image'; // this matches the property value in our Product model
	return (
		<div className="mb-2">
			<Label htmlFor={name} className="capitalize">
				Image
			</Label>
			<Input
				className="mt-1"
				id={name}
				name={name}
				type="file"
				required
				accept="image/*"
			/>
		</div>
	);
}
export default ImageInput;
