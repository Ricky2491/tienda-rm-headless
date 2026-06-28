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
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', minHeight: '100vh', backgroundColor: '#fcfcfc', color: '#111' }}>
      <Script src="https://www.paypal.com/sdk/js?client-id=test&currency=USD" strategy="afterInteractive" onLoad={() => setPaypalListo(true)} />

      <nav style={{ borderBottom: '1px solid #f0f0f0', padding: '0 24px', height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', zIndex: 100 }}>
        <h1 style={{ fontSize: '1.4rem', margin: 0, fontWeight: '700' }}><Link href="/" style={{ color: '#000', textDecoration: 'none' }}>Tienda RM</Link></h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setCarritoAbierto(true)} style={{ background: '#f5f5f7', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            🛒 <span style={{ marginLeft: '6px', backgroundColor: '#111', color: '#fff', borderRadius: '20px', padding: '2px 8px', fontSize: '0.75rem' }}>{totalArticulos}</span>
          </button>
          <button className="mobile-toggle" onClick={() => setMenuAbierto(!menuAbierto)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer' }}>{menuAbierto ? '✕' : '☰'}</button>
        </div>
      </nav>

      {carritoAbierto && (
        <div className="bolsa-compras-sidebar" style={{ position: 'fixed', top: 0, right: 0, height: '100dvh', backgroundColor: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.08)', zIndex: 200, padding: '24px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '16px', flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem' }}>Tu bolsa de compras</h2>
            <button onClick={() => setCarritoAbierto(false)} style={{ background: '#f5f5f7', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}>✕</button>
          </div>
          <div className="bolsa-productos-scroll" style={{ flexGrow: 1, overflowY: 'auto', padding: '10px 2px', minHeight: 0 }}>
            {carrito.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}>Carrito vacío.</div>
            ) : (
              <>
                {carrito.map((item) => (
                  <div key={item.variantId} style={{ display: 'flex', gap: '14px', padding: '16px 0', borderBottom: '1px solid #f5f5f7', position: 'relative' }}>
                    <img src={item.image} style={{ width: '65px', height: '65px', objectFit: 'contain', backgroundColor: '#fbfbfd', borderRadius: '8px' }} />
                    <div style={{ flexGrow: 1 }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}>{item.title}</h4>
                      <span style={{ fontSize: '0.88rem', fontWeight: '700' }}>{parseFloat(item.price?.amount).toFixed(2)} {item.price?.currencyCode}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                        <button onClick={() => handleModificarCantidadCarrito(item.variantId, -1)} style={{ border: '1px solid #d2d2d7', width: '26px', height: '26px' }}>-</button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => handleModificarCantidadCarrito(item.variantId, 1)} style={{ border: '1px solid #d2d2d7', width: '26px', height: '26px' }}>+</button>
                      </div>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop: '20px', paddingTop: '16px' }}>
                  <input type="text" placeholder="Nombre" id="cliente_nombre" style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #d2d2d7' }} />
                  <input type="text" placeholder="Apellido" id="cliente_apellido" style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #d2d2d7' }} />
                  <input type="tel" placeholder="Teléfono" id="cliente_telefono" style={{ width: '100%', padding: '10px', marginBottom: '16px', borderRadius: '8px', border: '1px solid #d2d2d7' }} />
                  <button onClick={handleProcesarPagoWhatsApp} style={{ backgroundColor: '#00cc66', color: '#fff', width: '100%', padding: '13px', borderRadius: '10px', border: 'none', marginBottom: '14px', cursor: 'pointer' }}>Confirmar Pedido por WhatsApp</button>
                  <div id="contenedor-botones-paypal" style={{ minHeight: '150px', width: '100%' }}></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div className="products-grid">
          {productosOrdenados.map((product) => (
            <div key={product.id} className="product-card" onClick={() => setProductoSeleccionado(product)} style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '16px', border: '1px solid #f0f0f0', cursor: 'pointer' }}>
              <div style={{ height: '240px', backgroundColor: '#fbfbfd', marginBottom: '16px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={product.images?.edges?.[0]?.node?.url} style={{ height: '100%', objectFit: 'contain' }} />
              </div>
              <h3>{product.title}</h3>
              <button onClick={(e) => { e.stopPropagation(); handleAgregarAlCarrito(product, product.variants?.edges?.[0]?.node?.id); }} style={{ backgroundColor: '#000', color: '#fff', padding: '10px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>Añadir a bolsa</button>
            </div>
          ))}
        </div>
      </div>

      {productoSeleccionado && (
        <div onClick={() => setProductoSeleccionado(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#fff', borderRadius: '20px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto', padding: '30px', position: 'relative' }}>
            <button onClick={() => setProductoSeleccionado(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: '#f5f5f7', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer' }}>✕</button>
            <h2 style={{ fontSize: '1.6rem', marginBottom: '20px' }}>{productoSeleccionado.title}</h2>
            {productoSeleccionado.title === 'Landing Page Responsive' ? (
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#333' }}>
                <p>Tu negocio merece una Landing Page interactiva y responsiva que trabaje para ti las 24 horas.</p>
                <p><strong>Lenguajes:</strong> Html5 - Css3 - JavaScript - Bootstrap.</p>
                <p><strong>Alojamiento Web (Hosting) y Despliegue:</strong> El costo base por el desarrollo del proyecto es de $30.00 (pago único). Para la puesta en línea de la plataforma, disponemos de las siguientes modalidades de hosting:</p>
                <ul>
                  <li><strong>Alojamiento Externo:</strong> Si usted ya cuenta con un proveedor de hosting o prefiere adquirirlo por su cuenta el costo del proyecto será solo de 30$.</li>
                  <li><strong>Alojamiento Gestionado:</strong> Si prefiere que la infraestructura corra por mi cuenta, el servicio tendrá un costo operativo adicional de $10.00 mensuales.</li>
                  <li><strong>Alojamiento Temporal:</strong> Para proyectos con una fecha de caducidad definida.</li>
                </ul>
                <p><strong>Link web ejemplo:</strong> <a href="https://perlacargocorp.netlify.app/" target="_blank">https://perlacargocorp.netlify.app/</a></p>
                <p><strong>Usuario:</strong> rm | <strong>Password:</strong> 1234</p>
                <p><strong>Portafolio:</strong> <a href="https://rm-portafolioresponsive.netlify.app/" target="_blank">https://rm-portafolioresponsive.netlify.app/</a></p>
              </div>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: productoSeleccionado.descriptionHtml }} />
            )}
            <button onClick={() => { handleAgregarAlCarrito(productoSeleccionado, productoSeleccionado.variants?.edges?.[0]?.node?.id); setProductoSeleccionado(null); }} style={{ marginTop: '20px', backgroundColor: '#000', color: '#fff', width: '100%', padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>Añadir a bolsa</button>
          </div>
        </div>
      )}

      <style jsx global>{`
        .bolsa-productos-scroll { scrollbar-width: thin; -webkit-overflow-scrolling: touch; }
        .products-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 28px; }
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