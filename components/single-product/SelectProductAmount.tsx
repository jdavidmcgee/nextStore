import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

// an enum is a way to organize a collection of related values. Below the enum is setting up 'Mode' to be a type that can only be one of two values: 'singleProduct' or 'cartItem'
export enum Mode {
	SingleProduct = 'singleProduct',
	CartItem = 'cartItem',
}

type SelectProductAmountProps = {
	mode: Mode.SingleProduct;
	amount: number;
	setAmount: (value: number) => void; // this doesn't return anything that is why it is void
};

type SelectCartItemAmountProps = {
	mode: Mode.CartItem;
	amount: number;
	setAmount: (value: number) => Promise<void>; // this is async
	isLoading: boolean;
};

function SelectProductAmount(
	props: SelectProductAmountProps | SelectCartItemAmountProps
) {
	const { mode, amount, setAmount } = props; // we can only destruct the props that are common to both types, the isLoading prop is only available in the SelectCartItemAmountProps type

	const cartItem = mode === Mode.CartItem; // if the mode is equal to 'cartItem' then cartItem will be true, otherwise it will be false

	return (
		<>
			<h4 className="mb-2">Quantity : </h4>
			<Select
				defaultValue={amount.toString()} // this is a shadcn component and they have set this component up to only take a string, so we need to convert the number to a string.  then we'll convert it back to a number so we can store it in the database correctly.
				onValueChange={value => setAmount(Number(value))}
				disabled={cartItem ? props.isLoading : false}> {/* if the mode is 'cartItem' then we'll disable the select if the isLoading prop is true, otherwise we'll leave it enabled */}
				<SelectTrigger className={cartItem ? 'w-[100px]' : 'w-[150px]'}>
					<SelectValue placeholder={amount} />
				</SelectTrigger>
				<SelectContent>
					{Array.from(
						{ length: cartItem ? amount + 10 : 10 },
						(_, index) => {
							const selectValue = (index + 1).toString();
							return (
								<SelectItem key={index} value={selectValue}>
									{selectValue}
								</SelectItem>
							);
						}
					)}
				</SelectContent>
			</Select>
		</>
	);
}
export default SelectProductAmount;
