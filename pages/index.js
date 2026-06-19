import { useState } from 'react';
import Link from 'next/link';
import { getAllProducts } from '../utils/shopify';

export default function Home({ products = [] }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', minHeight: '100vh', backgroundColor: '#fcfcfc', color: '#111' }}>
      
      {/* BARRA DE NAVEGACIÓN PREMIUM */}
      <nav style={{ 
        borderBottom: '1px solid #f0f0f0', 
        padding: '0 24px', 
        height: '70px',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        position: 'sticky', 
        top: 0, 
        backgroundColor: 'rgba(255, 255, 255, 0.85)', 
        backdropFilter: 'blur(10px)',
        zIndex: 100 
      }}>
        
        {/* Logo / Marca */}
        <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: '700', letterSpacing: '-0.5px' }}>
          <Link href="/" style={{ color: '#000', textDecoration: 'none' }}>Tienda RM</Link>
        </h1>

        {/* Menú de Escritorio (Oculto dinámicamente mediante CSS básico abajo) */}
        <div className="desktop-nav" style={{ display: 'flex', gap: '32px' }}>
          <Link href="/" style={{ color: '#111', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500' }}>Inicio</Link>
          <Link href="#" style={{ color: '#666', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500' }}>Colecciones</Link>
          <Link href="#" style={{ color: '#666', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500' }}>Contacto</Link>
        </div>

        {/* Botones de Acción */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Carrito */}
          <button 
            onClick={() => setCarritoAbierto(true)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer', 
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#f5f5f7'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>🛒</span>
            <span style={{ 
              marginLeft: '6px',
              backgroundColor: '#111', 
              color: '#fff', 
              borderRadius: '20px', 
              padding: '2px 8px', 
              fontSize: '0.75rem',
              fontWeight: '600'
            }}>0</span>
          </button>
          
          {/* Botón Hamburguesa Móvil */}
          <button 
            className="mobile-toggle"
            onClick={() => setMenuAbierto(!menuAbierto)} 
            style={{ 
              background: 'none', 
              border: 'none', 
              fontSize: '1.4rem', 
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px'
            }}
          >
            {menuAbierto ? '✕' : '☰'}
          </button>
        </div>
      </nav>

      {/* MENÚ MÓVIL DESPLEGABLE CON ANIMACIÓN SIMULADA */}
      {menuAbierto && (
        <div style={{ 
          backgroundColor: '#fff', 
          borderBottom: '1px solid #f0f0f0', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          position: 'absolute',
          width: '100%',
          left: 0,
          zIndex: 99,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
        }}>
          <Link href="/" onClick={() => setMenuAbierto(false)} style={{ color: '#000', textDecoration: 'none', fontSize: '1.1rem', fontWeight: '600' }}>Inicio</Link>
          <Link href="#" onClick={() => setMenuAbierto(false)} style={{ color: '#444', textDecoration: 'none', fontSize: '1.1rem' }}>Colecciones</Link>
          <Link href="#" onClick={() => setMenuAbierto(false)} style={{ color: '#444', textDecoration: 'none', fontSize: '1.1rem' }}>Contacto</Link>
        </div>
      )}

      {/* PANEL LATERAL DEL CARRITO (SIDEBAR SLIDE-OUT) */}
      {carritoAbierto && (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          width: '100%', 
          maxWidth: '420px', 
          height: '100vh', 
          backgroundColor: '#fff', 
          boxShadow: '-10px 0 30px rgba(0,0,0,0.08)', 
          zIndex: 200, 
          padding: '30px', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>Tu bolsa de compras</h2>
            <button onClick={() => setCarritoAbierto(false)} style={{ background: '#f5f5f7', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}>
            <span style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🛍️</span>
            <p style={{ margin: 0, fontSize: '1rem' }}>Tu carrito está vacío actualmene.</p>
          </div>
          <button style={{ backgroundColor: '#ccc', color: '#fff', border: 'none', padding: '16px', borderRadius: '12px', width: '100%', fontSize: '1rem', fontWeight: '600', cursor: 'not-allowed' }} disabled>
            Proceder al pago
          </button>
        </div>
      )}

      {/* CUERPO CENTRAL DE LA PÁGINA */}
      <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Banner de Bienvenida Estilizado */}
        <header style={{ marginBottom: '48px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0066cc', display: 'block', marginBottom: '8px' }}>Nueva Colección Disponible</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', margin: '0 0 12px 0' }}>Explora el Catálogo Exclusivo</h2>
          <p style={{ color: '#68686e', fontSize: '1.1rem', margin: 0, maxWidth: '600px', margin: '0 auto' }}>Una experiencia ultra rápida conectada directamente mediante la API Headless de Shopify.</p>
        </header>

        <main>
          {!products || products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
              <p style={{ color: '#86868b', fontSize: '1.1rem', margin: 0 }}>Cargando catálogo o sincronizando variables de entorno...</p>
            </div>
          ) : (
            /* Ajuste Responsive de la Cuadrícula */
            <div className="products-grid">
              {products.map((product) => {
                const image = product.images?.edges?.[0]?.node;
                const price = product.priceRange?.minVariantPrice;

                return (
                  <div key={product.id} className="product-card" style={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: '1px solid #f0f0f0', 
                    padding: '16px', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.01)'
                  }}>
                    {/* Contenedor de Imagen */}
                    <div style={{ width: '100%', height: '240px', backgroundColor: '#fbfbfd', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      {image ? (
                        <img src={image.url} alt={image.altText || product.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
                      ) : (
                        <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Sin Imagen</div>
                      )}
                    </div>

                    {/* Título e Info */}
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 8px 0', lineHeight: '1.4', color: '#111' }}>{product.title}</h3>
                    <p style={{ fontSize: '0.88rem', color: '#68686e', flexGrow: 1, margin: '0 0 20px 0', height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.5' }}>
                      {product.description || 'Sin descripción detallada disponible.'}
                    </p>
                    
                    {/* Fila de Precio y Acción */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f5f5f7' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', color: '#86868b', textTransform: 'uppercase', fontWeight: '500' }}>Precio</span>
                        <span style={{ fontWeight: '700', fontSize: '1.2rem', color: '#000' }}>
                          {price ? `${parseFloat(price.amount).toFixed(2)} ${price.currencyCode}` : '0.00'}
                        </span>
                      </div>
                      
                      <Link 
                        href={`/products/${product.handle}`}
                        style={{ 
                          backgroundColor: '#001122', 
                          color: '#fff', 
                          textDecoration: 'none',
                          padding: '10px 18px', 
                          borderRadius: '10px', 
                          fontSize: '0.88rem',
                          fontWeight: '600',
                          transition: 'background-color 0.2s ease',
                          cursor: 'pointer' 
                        }}
                      >
                        Ver detalles
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* CÓDIGO CSS INLINE COMPLEMENTARIO PARA COMPORTAMIENTO RESPONSIVE */}
      <style jsx global>{`
        /* Configuración de la cuadrícula adaptiva */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 28px;
        }

        /* Hover elegante para las tarjetas */
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.04) !important;
          border-color: #e2e2e7 !important;
        }

        /* Lógica del Menú de Escritorio vs Móvil */
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-nav { display: none !important; }
          .mobile-toggle { display: block !important; }
        }
      `}</style>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const products = await getAllProducts();
    return {
      props: { products: products || [] },
    };
  } catch (error) {
    console.error("Error cargando productos en el Home:", error);
    return {
      props: { products: [] },
    };
  }
}