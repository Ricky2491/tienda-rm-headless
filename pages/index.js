import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { getAllProducts, createCheckout } from '../utils/shopify';

export default function Home({ products = [] }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [cantidadesSelector, setCantidadesSelector] = useState({});
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [paypalListo, setPaypalListo] = useState(false);

  // Ordenar productos: Landing Page primero
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
      alert("Por favor, completa Nombre, Apellido y Teléfono para procesar el pedido.");
      return;
    }

    const tuTelefonoWhatsApp = "584120000000"; 
    let mensaje = `🔔 *NUEVO PEDIDO - TIENDA RM*\n\n👤 *Cliente:* ${nombre} ${apellido}\n📞 *Contacto:* ${telefonoCliente}\n📦 *Pago Móvil / Transferencia*\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n🛒 *Detalle:*\n`;
    carrito.forEach(item => { mensaje += `• ${item.title} x${item.cantidad} — (${parseFloat(item.price?.amount).toFixed(2)} ${item.price?.currencyCode})\n`; });
    mensaje += `\n💰 *TOTAL:* ${subtotalPrecio.toFixed(2)} ${codigoMoneda}`;
    
    window.location.href = `https://wa.me/${tuTelefonoWhatsApp}?text=${encodeURIComponent(mensaje)}`;
  };

  // Efecto para inicializar PayPal
  useEffect(() => {
    if ((paypalListo || window.paypal) && carritoAbierto && carrito.length > 0) {
      const timeoutId = setTimeout(() => {
        const contenedor = document.getElementById('contenedor-botones-paypal');
        if (contenedor && contenedor.innerHTML === '') {
          window.paypal.Buttons({
            createOrder: (data, actions) => {
              return actions.order.create({
                purchase_units: [{ amount: { currency_code: codigoMoneda, value: subtotalPrecio.toFixed(2) } }]
              });
            },
            onApprove: async (data, actions) => {
              await actions.order.capture();
              alert("¡Gracias por tu compra!");
              setCarrito([]);
              setCarritoAbierto(false);
            }
          }).render('#contenedor-botones-paypal');
        }
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [carritoAbierto, carrito.length, paypalListo, subtotalPrecio, codigoMoneda]);

  return (
    <div style={{ fontFamily: '-apple-system, sans-serif', minHeight: '100vh', backgroundColor: '#fcfcfc' }}>
      <Script src="https://www.paypal.com/sdk/js?client-id=test&currency=USD" strategy="afterInteractive" onLoad={() => setPaypalListo(true)} />

      {/* NAVBAR */}
      <nav style={{ padding: '0 24px', height: '70px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', zIndex: 100, borderBottom: '1px solid #f0f0f0' }}>
        <h1 style={{ fontSize: '1.4rem', margin: 0 }}><Link href="/" style={{ color: '#000', textDecoration: 'none' }}>Tienda RM</Link></h1>
        <button onClick={() => setCarritoAbierto(true)} style={{ background: '#f5f5f7', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}>
          🛒 Bolsa ({totalArticulos})
        </button>
      </nav>

      {/* CARRITO SIDEBAR - ESTRUCTURA CORREGIDA */}
      {carritoAbierto && (
        <div style={{ position: 'fixed', top: 0, right: 0, width: '100%', maxWidth: '420px', height: '100vh', backgroundColor: '#fff', boxShadow: '-10px 0 30px rgba(0,0,0,0.1)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Tu Compra</h2>
            <button onClick={() => setCarritoAbierto(false)} style={{ border: 'none', background: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
          </div>

          {/* CONTENEDOR CON SCROLL PARA PRODUCTOS Y PAGOS */}
          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
            {carrito.length === 0 ? <p>Carrito vacío.</p> : (
              <>
                {carrito.map(item => (
                  <div key={item.variantId} style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img src={item.image} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0 }}>{item.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                        <button onClick={() => handleModificarCantidadCarrito(item.variantId, -1)}>-</button>
                        <span>{item.cantidad}</span>
                        <button onClick={() => handleModificarCantidadCarrito(item.variantId, 1)}>+</button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* FORMULARIO Y PAGOS */}
                <div style={{ marginTop: '30px', borderTop: '2px solid #f0f0f0', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                    <input type="text" id="cliente_nombre" placeholder="Nombre" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                    <input type="text" id="cliente_apellido" placeholder="Apellido" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }} />
                  </div>
                  <input type="tel" id="cliente_telefono" placeholder="Teléfono" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', marginBottom: '15px' }} />
                  
                  <button onClick={handleProcesarPagoWhatsApp} style={{ width: '100%', padding: '12px', backgroundColor: '#00cc66', color: '#fff', border: 'none', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold' }}>
                    Confirmar por WhatsApp
                  </button>
                  <div id="contenedor-botones-paypal" style={{ minHeight: '50px' }}></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* CATÁLOGO PRODUCTOS */}
      <main style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
          {productosOrdenados.map((product) => (
            <div key={product.id} style={{ border: '1px solid #eee', padding: '20px', borderRadius: '16px' }}>
              <img src={product.images?.edges?.[0]?.node?.url} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '12px' }} />
              <h3>{product.title}</h3>
              <button onClick={() => handleAgregarAlCarrito(product, product.variants?.edges?.[0]?.node?.id)} style={{ width: '100%', padding: '10px', marginTop: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#000', color: '#fff' }}>
                Añadir al carrito
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}