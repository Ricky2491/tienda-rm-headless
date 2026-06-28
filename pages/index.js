import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { getAllProducts, createCheckout } from '../utils/shopify';

export default function Home({ products = [] }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [comprando, setComprando] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [cantidadesSelector, setCantidadesSelector] = useState({});
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [paypalListo, setPaypalListo] = useState(false);

  const productosOrdenados = [...products].sort((a, b) => {
    if (a.title === 'Landing Page Responsive') return -1;
    if (b.title === 'Landing Page Responsive') return 1;
    return 0;
  });

  const handleCambiarCantidadSelector = (productId, delta) => {
    setCantidadesSelector((prev) => {
      const cantidadActual = prev[productId] || 1;
      const nuevaCantidad = cantidadActual + delta;
      return { ...prev, [productId]: nuevaCantidad < 1 ? 1 : nuevaCantidad };
    });
  };

  const handleAgregarAlCarrito = (product, variantId) => {
    if (!variantId) return alert("Este producto no posee variantes activas.");
    const cantidadAñadir = cantidadesSelector[product.id] || 1;

    setCarrito((prevCarrito) => {
      const itemExistente = prevCarrito.find((item) => item.variantId === variantId);
      
      if (itemExistente) {
        return prevCarrito.map((item) =>
          item.variantId === variantId
            ? { ...item, cantidad: item.cantidad + cantidadAñadir }
            : item
        );
      }

      return [
        ...prevCarrito,
        {
          id: product.id,
          title: product.title,
          image: product.images?.edges?.[0]?.node?.url,
          price: product.priceRange?.minVariantPrice,
          variantId: variantId,
          cantidad: cantidadAñadir,
        },
      ];
    });

    setCantidadesSelector((prev) => ({ ...prev, [product.id]: 1 }));
    setCarritoAbierto(true);
  };

  const handleModificarCantidadCarrito = (variantId, delta) => {
    setCarrito((prevCarrito) =>
      prevCarrito
        .map((item) => {
          if (item.variantId === variantId) {
            const nuevaCantidad = item.cantidad + delta;
            return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : null;
          }
          return item
        })
        .filter(Boolean)
    );
  };

  const totalArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const subtotalPrecio = carrito.reduce((sum, item) => sum + parseFloat(item.price?.amount || 0) * item.cantidad, 0);
  const codigoMoneda = carrito[0]?.price?.currencyCode || 'USD';

  const handleProcesarPagoWhatsApp = () => {
    const nombre = document.getElementById('cliente_nombre')?.value.trim();
    const apellido = document.getElementById('cliente_apellido')?.value.trim();
    const telefonoCliente = document.getElementById('cliente_telefono')?.value.trim();

    if (!nombre || !apellido || !telefonoCliente) {
      alert("Por favor, completa tu Nombre, Apellido y Teléfono para procesar el pedido.");
      return;
    }

    const tuTelefonoWhatsApp = "584120000000"; 
    let mensaje = `🔔 *NUEVO PEDIDO - TIENDA RM*\n\n👤 *Cliente:* ${nombre} ${apellido}\n📞 *Contacto:* ${telefonoCliente}\n📦 *Método de Pago:* Pago Móvil / Transferencia Bancaria\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n🛒 *Detalle de la compra:*\n`;
    carrito.forEach((item) => {
      mensaje += `• ${item.title} x${item.cantidad} — (${parseFloat(item.price?.amount).toFixed(2)} ${item.price?.currencyCode} c/u)\n`;
    });
    mensaje += `\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n💰 *TOTAL A PAGAR:* ${subtotalPrecio.toFixed(2)} ${codigoMoneda}\n\n📌 _Por favor, indícanos los datos de tu pago._`;
    window.location.href = `https://wa.me/${tuTelefonoWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  };

  useEffect(() => {
    if ((paypalListo || window.paypal) && carritoAbierto && carrito.length > 0) {
      const timeoutId = setTimeout(() => {
        const contenedor = document.getElementById('contenedor-botones-paypal');
        if (contenedor && contenedor.innerHTML === '') {
          window.paypal.Buttons({
            createOrder: (data, actions) => {
              return actions.order.create({
                purchase_units: [{
                  description: "Compra unificada en Tienda RM",
                  amount: { currency_code: codigoMoneda || "USD", value: subtotalPrecio.toFixed(2) }
                }]
              });
            },
            onApprove: async (data, actions) => {
              const order = await actions.order.capture();
              alert(`¡Pago procesado con éxito! Gracias por tu compra, ${order.payer.name.given_name}.`);
              setCarrito([]);
              setCarritoAbierto(false);
            },
            onError: (err) => console.error("Error en la pasarela de PayPal:", err)
          }).render('#contenedor-botones-paypal');
        }
      }, 250);
      return () => clearTimeout(timeoutId);
    }
  }, [carritoAbierto, carrito.length, paypalListo, subtotalPrecio, codigoMoneda]);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', minHeight: '100vh', backgroundColor: '#fafafa', color: '#111' }}>
      <Script src="https://www.paypal.com/sdk/js?client-id=test&currency=USD" strategy="afterInteractive" onLoad={() => setPaypalListo(true)} />

      <nav style={{ borderBottom: '1px solid #eaeaea', padding: '0 24px', height: '72px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
        <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: '800', letterSpacing: '-0.5px' }}><Link href="/" style={{ color: '#000', textDecoration: 'none' }}>Tienda RM</Link></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setCarritoAbierto(true)} style={{ background: '#f0f0f0', border: 'none', padding: '10px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', fontWeight: '600' }}>
            🛒 <span style={{ marginLeft: '8px', backgroundColor: '#000', color: '#fff', borderRadius: '20px', padding: '2px 10px', fontSize: '0.8rem' }}>{totalArticulos}</span>
          </button>
          <button className="mobile-toggle" onClick={() => setMenuAbierto(!menuAbierto)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>{menuAbierto ? '✕' : '☰'}</button>
        </div>
      </nav>

      {carritoAbierto && (
        <div className="bolsa-compras-sidebar" style={{ position: 'fixed', top: 0, right: 0, height: '100dvh', backgroundColor: '#fff', boxShadow: '-20px 0 40px rgba(0,0,0,0.1)', zIndex: 200, padding: '24px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '20px', flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '700' }}>Tu bolsa</h2>
            <button onClick={() => setCarritoAbierto(false)} style={{ background: '#f5f5f7', border: 'none', borderRadius: '50%', width: '38px', height: '38px', cursor: 'pointer' }}>✕</button>
          </div>
          
          <div className="bolsa-productos-scroll" style={{ flexGrow: 1, overflowY: 'auto', padding: '10px 0', minHeight: 0 }}>
            {carrito.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Carrito vacío.</div>
            ) : (
              <>
                {carrito.map((item) => (
                  <div key={item.variantId} style={{ display: 'flex', gap: '16px', padding: '16px 0', borderBottom: '1px solid #f9f9f9', alignItems: 'center' }}>
                    <img src={item.image} style={{ width: '70px', height: '70px', objectFit: 'contain', backgroundColor: '#f9f9f9', borderRadius: '12px', padding: '4px' }} />
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem' }}>{item.title}</h4>
                      <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>{parseFloat(item.price?.amount).toFixed(2)} {item.price?.currencyCode}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                        <button onClick={() => handleModificarCantidadCarrito(item.variantId, -1)} style={{ border: '1px solid #eee', background: '#fff', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer' }}>-</button>
                        <span style={{ fontWeight: '600' }}>{item.cantidad}</span>
                        <button onClick={() => handleModificarCantidadCarrito(item.variantId, 1)} style={{ border: '1px solid #eee', background: '#fff', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer' }}>+</button>
                      </div>
                    </div>
                  </div>
                ))}

                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #f5f5f7' }}>
                  <input type="text" placeholder="Nombre" id="cliente_nombre" style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                  <input type="text" placeholder="Apellido" id="cliente_apellido" style={{ width: '100%', padding: '12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                  <input type="tel" placeholder="Teléfono" id="cliente_telefono" style={{ width: '100%', padding: '12px', marginBottom: '16px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box' }} />
                  
                  <button onClick={handleProcesarPagoWhatsApp} style={{ backgroundColor: '#25D366', color: '#fff', width: '100%', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: '700', marginBottom: '15px', cursor: 'pointer' }}>
                    Confirmar por WhatsApp
                  </button>
                  <div id="contenedor-botones-paypal" style={{ minHeight: '50px', width: '100%' }}></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <main style={{ padding: '60px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <header style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', margin: '0 0 10px' }}>Catálogo Exclusivo</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Selecciona tus productos favoritos.</p>
        </header>

        <div className="products-grid">
          {productosOrdenados.map((product) => (
            <div key={product.id} className="product-card" style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '20px', border: '1px solid #f0f0f0', transition: 'transform 0.2s' }}>
              <div style={{ height: '220px', backgroundColor: '#f9f9f9', marginBottom: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={product.images?.edges?.[0]?.node?.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 15px' }}>{product.title}</h3>
              <button onClick={() => handleAgregarAlCarrito(product, product.variants?.edges?.[0]?.node?.id)} style={{ backgroundColor: '#000', color: '#fff', padding: '12px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer', width: '100%', fontWeight: '600' }}>
                Añadir a bolsa
              </button>
            </div>
          ))}
        </div>
      </main>

      <style jsx global>{`
        .product-card:hover { transform: translateY(-8px); box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
        .bolsa-productos-scroll { scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 30px; }
        @media (max-width: 540px) { .bolsa-compras-sidebar { width: 100% !important; } }
        @media (min-width: 541px) { .bolsa-compras-sidebar { width: 420px !important; } }
      `}</style>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const products = await getAllProducts();
    return { props: { products: products || [] } };
  } catch (error) {
    return { props: { products: [] } };
  }
}