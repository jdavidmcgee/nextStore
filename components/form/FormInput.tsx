import { Label } from '../ui/label';
import { Input } from '../ui/input';

type FormInputProps = {
	name: string;
	type: string;
	label?: string;
	defaultValue?: string;
	placeholder?: string;
};

function FormInput({
	label,
	name,
	type,
	defaultValue,
	placeholder,
}: FormInputProps) {
	return (
		<div className="mb-2">
			<Label htmlFor={name} className="capitalize">
				{/* if the label is provided we'll use that, if not we'll use the name */}
				{label || name}
			</Label>
			<Input
				className="mt-1"
				id={name}
				name={name}
				type={type}
				defaultValue={defaultValue}
				placeholder={placeholder}
				required // this enable us to use HTML5 validation as much as possible
			/>
		</div>
	);
}

export default FormInput;
