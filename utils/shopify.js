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
            descriptionHtml
            images(first: 1) {
              edges {
                node {
                  url
                  altText
                }
              }
            }
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
        descriptionHtml
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

// 4. EXPORTACIÓN: Crear una sesión de carrito seguro en Shopify
export async function createCheckout(lineItems = []) {
  const query = `
    mutation cartCreate($input: CartInput!) {
      cartCreate(input: $input) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  // Se estructuran las variantes y cantidades agregadas dinámicamente
  const variables = {
    input: {
      lines: lineItems
    }
  };

  try {
    const response = await shopifyFetch({ query, variables });
    if (response.errors || response.data?.cartCreate?.userErrors?.length > 0) {
      console.error("❌ Error en cartCreate unificado:", response.errors || response.data.cartCreate.userErrors);
    }
    
    const cart = response.data?.cartCreate?.cart;
    return cart ? { id: cart.id, webUrl: cart.checkoutUrl } : null;
  } catch (error) {
    console.error("Error crítico en checkout unificado:", error);
    return null;
  }
}

// 5. EXPORTACIÓN: Añadir producto usando el tipo correcto (CartLineInput!) exigido por la API 2024-01
export async function addLineItemsToCheckout(cartId, variantId, quantity = 1) {
  const query = `
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart {
          id
          checkoutUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    cartId,
    lines: [{ merchandiseId: variantId, quantity: parseInt(quantity, 10) }]
  };

  try {
    const response = await shopifyFetch({ query, variables });
    if (response.errors || response.data?.cartLinesAdd?.userErrors?.length > 0) {
      console.error("❌ Error en cartLinesAdd:", response.errors || response.data.cartLinesAdd.userErrors);
    }

    const cart = response.data?.cartLinesAdd?.cart;
    return cart ? { id: cart.id, webUrl: cart.checkoutUrl } : null;
  } catch (error) {
    console.error("Error crítico añadiendo producto al carrito:", error);
    return null;
  }
}