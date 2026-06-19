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
            # ---> AGREGA ESTO: Necesitamos el ID de la variante para poder venderlo
            variants(first: 1) {
              edges {
                node {
                  id
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

// 4. EXPORTACIÓN: Crear un nuevo Checkout (Carrito de pago) en Shopify
export async function createCheckout() {
  const query = `
    mutation checkoutCreate($input: CheckoutCreateInput!) {
      checkoutCreate(input: $input) {
        checkout {
          id
          webUrl
        }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {}
  };

  const response = await shopifyFetch({ query, variables });
  return response.data?.checkoutCreate?.checkout || null;
}

// 5. EXPORTACIÓN: Añadir un producto al Checkout y obtener la URL de pago real
export async function addLineItemsToCheckout(checkoutId, variantId, quantity = 1) {
  const query = `
    mutation checkoutLineItemsAdd($checkoutId: ID!, $lineItems: [CheckoutLineItemInput!]!) {
      checkoutLineItemsAdd(checkoutId: $checkoutId, lineItems: $lineItems) {
        checkout {
          id
          webUrl
        }
        checkoutUserErrors {
          code
          field
          message
        }
      }
    }
  `;

  const variables = {
    checkoutId,
    lineItems: [{ variantId, quantity }]
  };

  const response = await shopifyFetch({ query, variables });
  return response.data?.checkoutLineItemsAdd?.checkout || null;
}