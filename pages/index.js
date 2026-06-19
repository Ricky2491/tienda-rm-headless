import Link from 'next/link';
import { getAllProducts } from '../utils/shopify';

export default function Home({ products }) {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '20px', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '2.5rem', color: '#111' }}>Tienda RM</h1>
        <p style={{ color: '#666' }}>Catálogo Exclusivo / Headless Storefront</p>
      </header>

      <main>
        {products.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>No se encontraron productos en el catálogo o revisa las variables de entorno.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {products.map((product) => {
              const image = product.images.edges[0]?.node;
              const price = product.priceRange.minVariantPrice;

              return (
                <div key={product.id} style={{ border: '1px solid #eaeaea', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  {image ? (
                    <img src={image.url} alt={image.altText || product.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px' }} />
                  ) : (
                    <div style={{ width: '100%', height: '200px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}>Sin Imagen</div>
                  )}
                  <h3 style={{ fontSize: '1.2rem', margin: '15px 0 10px 0', color: '#222' }}>{product.title}</h3>
                  <p style={{ fontSize: '0.9rem', color: '#666', flexGrow: 1, height: '40px', overflow: 'hidden' }}>{product.description}</p>
                  <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#000' }}>
                      {parseFloat(price.amount).toFixed(2)} {price.currencyCode}
                    </span>
                    
                    {/* CAMBIO CLAVE AQUÍ: Se cambió button por Link dinámico basado en el handle */}
                    <Link 
                      href={`/products/${product.handle}`}
                      style={{ 
                        backgroundColor: '#111', 
                        color: '#fff', 
                        textDecoration: 'none',
                        padding: '8px 12px', 
                        borderRadius: '4px', 
                        fontSize: '0.9rem',
                        cursor: 'pointer' 
                      }}
                    >
                      Ver Producto
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  const products = await getAllProducts();
  return {
    props: { products },
  };
}