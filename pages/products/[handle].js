import { getProductByHandle } from '../../utils/shopify';
import Link from 'next/link';

export default function ProductDetails({ product }) {
  if (!product) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>Producto no encontrado.</div>;
  }

  const image = product.images.edges[0]?.node;
  const price = product.priceRange.minVariantPrice;

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <Link href="/" style={{ color: '#666', textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        ← Volver al catálogo
      </Link>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '20px' }}>
        {/* Imagen del Producto */}
        <div>
          {image ? (
            <img src={image.url} alt={image.altText || product.title} style={{ width: '100%', borderRadius: '8px', objectFit: 'contain', maxHeight: '500px' }} />
          ) : (
            <div style={{ width: '100%', height: '400px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sin Imagen</div>
          )}
        </div>

        {/* Detalles del Producto */}
        <div>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: '#111' }}>{product.title}</h1>
          <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#000', display: 'block', marginBottom: '20px' }}>
            {parseFloat(price.amount).toFixed(2)} {price.currencyCode}
          </span>
          <p style={{ color: '#444', lineHeight: '1.6', marginBottom: '30px' }}>{product.description}</p>
          
          <button 
            onClick={() => alert('¡Añadido al carrito! (Lógica de almacenamiento local en construcción)')}
            style={{ backgroundColor: '#111', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '4px', fontSize: '1rem', width: '100%', cursor: 'pointer' }}
          >
            Añadir al Carrito
          </button>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  const product = await getProductByHandle(params.handle);
  return {
    props: { product },
  };
}