import { IoStorefront } from 'react-icons/io5';
import { VscCode } from 'react-icons/vsc';
import { DiCodeigniter } from 'react-icons/di';

import { Button } from '../ui/button';
import Link from 'next/link';

function Logo() {
	return (
		<Button size="icon" asChild>
			<Link href="/">
				<DiCodeigniter className="w-6 h-6" />
			</Link>
		</Button>
	);
}

export default Logo;
