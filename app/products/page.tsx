import ProductsContainer from "@/components/products/ProductsContainer";


function ProductsPage({searchParams}:{searchParams: {layout?: string, search?: string}}) {
	// with the searchParams, we can fetch the products from the server
	// the url of: http://localhost:3000/products?search=ava&random=name
  // will give us: {search: 'ava', random: 'name'}

  const layout = searchParams.layout || 'grid';
  const search = searchParams.search || ''; // and empty string will return all products - not undefined
	return <ProductsContainer layout={layout} search={search} />
}

export default ProductsPage
