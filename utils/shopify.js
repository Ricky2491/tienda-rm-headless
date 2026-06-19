// Consulta GraphQL para traer el detalle de un producto específico por su handle
export async function getProductByHandle(handle) {
  const query = `
    query getProduct($handle: String!) {
      product(handle: $handle) {
        id
        title
        description
        images(first: 5) {
          edges {
            node {
              url
              altText
            }
          }
        }
        priceRange {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  `;
  
  const response = await shopifyFetch({ query, variables: { handle } });
  return response.data?.product || null;
}