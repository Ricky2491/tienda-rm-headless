// 1. FUNCIÓN INTERNA: Conexión base con la API GraphQL de Shopify
async function shopifyFetch({ query, variables = {} }) {
  const endpoint = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const key = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  try {
    const result = await fetch(`https://${endpoint}/api/2024-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': key,
      },
      body: JSON.stringify({ query, variables }),
    });

    return await result.json();
  } catch (error) {
    console.error("Error crítico en shopifyFetch:", error);
    return { data: null };
  }
}

// 2. EXPORTACIÓN: Traer TODOS los productos (Para la página de inicio / index.js)
export async function getAllProducts() {
  const query = `
    query getProducts {
      products(first: 20) {
        edges {
          node {
            id
            title
            handle
            description
            images(first: 1) {
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
      }
    }
  `;

  const response = await shopifyFetch({ query });
  
  // Convertimos la estructura de bordes de GraphQL en un array plano fácil de mapear
  return response.data?.products?.edges.map(edge => edge.node) || [];
}

// 3. EXPORTACIÓN: Traer el detalle de un producto específico por su handle (Para pages/products/[handle].js)
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