import { useState } from 'react';
import Link from 'next/link';
import { getAllProducts } from '../utils/shopify';

export default function Home({ products }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', minHeight: '100vh', backgroundColor: '#fff' }}>
      
      {/* MENÚ SUPERIOR INTERACTIVO */}
      <nav style={{ borderBottom: '1px solid #eaeaea', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 100 }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 'bold' }}>
          <Link href="/" style={{ color: '#000', textDecoration: 'none' }}>Tienda RM</Link>
        </h1>

        {/* Enlaces para Escritorio */}
        <div style={{ display: 'none', gap: '20px' }} className="desktop-menu">
          <Link href="/" style={{ color: '#333', textDecoration: 'none' }}>Inicio</Link>
          <Link href="#" style={{ color: '#333', textDecoration: 'none' }}>Colecciones</Link>
        </div>

        {/* Botones de Interacción (Carrito y Hamburguesa) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button 
            onClick={() => setCarritoAbierto(true)} 
            style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', position: 'relative' }}
          >
            🛒 <span style={{ position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#111', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '0.75rem' }}>0</span>
          </button>
          
          <button 
            onClick={() => setMenuAbierto(!menuAbierto)} 
            style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* MENÚ MÓVIL DESPLEGABLE */}
      {menuAbierto && (
        <div style={{ backgroundColor: '#f9f9f9', borderBottom: '1px solid #eaeaea', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <Link href="/" onClick={() => setMenuAbierto(false)} style={{ color: '#000', textDecoration: 'none', fontWeight: '500' }}>Inicio</Link>
          <Link href="#" onClick={() => setMenuAbierto(false)} style={{ color: '#000', textDecoration: 'none', fontWeight: '500' }}>Colecciones</Link>
        </div>
      )}

      {/* PANEL LATERAL DEL CARRITO (SIDEBAR) */}
      {carritoAbierto && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '400px', height: '100vh', backgroundColor: '#fff', boxShadow: '-5px 0 15px rgba(0,0,0,0.1)', zIndex: 200, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Tu Carrito</h2>
            <button onClick={() => setCarritoAbierto(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            El carrito está vacío.
          </div>
          <button style={{ backgroundColor: '#111', color: '#fff', border: 'none', padding: '15px', borderRadius: '4px', width: '100%', fontSize: '1rem', cursor: 'not-allowed' }} disabled>
            Proceder al pago
          </button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ padding: '20px 0', marginBottom: '30px' }}>
          <p style={{ color: '#666', margin: 0 }}>Catálogo Exclusivo / Headless Storefront</p>
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

      {/* Pequeño estilo inline complementario para ocultar/mostrar menú en escritorio */}
      <style jsx global>{`
        @media (min-width: 768px) {
          .desktop-menu { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

export async function getServerSideProps() {
  const products = await getAllProducts();
  return {
    props: { products },
  };
}