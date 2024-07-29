'use client';
import { Input } from '../ui/input';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { useState, useEffect } from 'react';

function NavSearch() {
	const searchParams = useSearchParams();
	const { replace } = useRouter();

	const [search, setSearch] = useState(
		searchParams.get('search')?.toString() || ''
	);

	const handleSearch = useDebouncedCallback((value: string) => {
		const params = new URLSearchParams(searchParams);
		if (value) {
			params.set('search', value);
		} else {
			params.delete('search');
		}
		replace(`/products?${params.toString()}`);
	}, 300);

	useEffect(() => {
		const searchValue = searchParams.get('search');
		if (!searchValue) {
			setSearch('');
		}
	}, [searchParams]);

	return (
		<Input
			type="search"
			placeholder="Search for products..."
			className="max-w-xs dark:bg-muted"
			onChange={event => {
				setSearch(event.target.value);
				handleSearch(event.target.value);
			}}
			value={search}
		/>
	);
}

export default NavSearch;
