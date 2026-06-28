import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
// Se importa 'createCheckout' adaptado para recibir el lote completo de productos
import { getAllProducts, createCheckout } from '../utils/shopify';

export default function Home({ products = [] }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  // Estado para bloquear la pantalla/botón durante la llamada final de checkout
  const [comprando, setComprando] = useState(false);

  // Estado del carrito de compras local interactivo
  const [carrito, setCarrito] = useState([]);

  // Estado para rastrear las cantidades seleccionadas en la cuadrícula de productos
  const [cantidadesSelector, setCantidadesSelector] = useState({});

  // Estado para controlar el producto seleccionado en el modal de detalles
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);

  // Estado para controlar si el SDK de PayPal ya se cargó en el navegador
  const [paypalListo, setPaypalListo] = useState(false);

  // 🌟 MODIFICACIÓN: Reordenar los productos para poner "Landing Page Responsive" de primero
  const productosOrdenados = [...products].sort((a, b) => {
    if (a.title === 'Landing Page Responsive') return -1;
    if (b.title === 'Landing Page Responsive') return 1;
    return 0;
  });

  // Manejar el selector de cantidad (+ / -) de cada producto antes de agregarlo
  const handleCambiarCantidadSelector = (productId, delta) => {
    setCantidadesSelector((prev) => {
      const cantidadActual = prev[productId] || 1;
      const nuevaCantidad = cantidadActual + delta;
      return { ...prev, [productId]: nuevaCantidad < 1 ? 1 : nuevaCantidad };
    });
  };

  // Agregar productos acumulativos a la bolsa de compras local
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

  // Modificar unidades o remover elementos directamente desde el Sidebar
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

  // LÓGICA: Procesar el pedido vía WhatsApp
  const handleProcesarPagoWhatsApp = () => {
    const nombre = document.getElementById('cliente_nombre')?.value.trim();
    const apellido = document.getElementById('cliente_apellido')?.value.trim();
    const telefonoCliente = document.getElementById('cliente_telefono')?.value.trim();

    if (!nombre || !apellido || !telefonoCliente) {
      alert("Por favor, completa tu Nombre, Apellido y Teléfono para procesar el pedido.");
      return;
    }

    const tuTelefonoWhatsApp = "584120000000"; 

    let mensaje = `🔔 *NUEVO PEDIDO - TIENDA RM*\n\n`;
    mensaje += `👤 *Cliente:* ${nombre} ${apellido}\n`;
    mensaje += `📞 *Contacto:* ${telefonoCliente}\n`;
    mensaje += `📦 *Método de Pago:* Pago Móvil / Transferencia Bancaria\n`;
    mensaje += `⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n\n`;
    mensaje += `🛒 *Detalle de la compra:*\n`;

    carrito.forEach((item) => {
      mensaje += `• ${item.title} x${item.cantidad} — (${parseFloat(item.price?.amount).toFixed(2)} ${item.price?.currencyCode} c/u)\n`;
    });

    mensaje += `\n⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯\n`;
    mensaje += `💰 *TOTAL A PAGAR:* ${subtotalPrecio.toFixed(2)} ${codigoMoneda}\n\n`;
    mensaje += `📌 _Por favor, indícanos los datos de tu Pago Móvil o el número de referencia para validar tu pago y procesar tu orden inmediatamente._`;

    const urlFinal = `https://wa.me/${tuTelefonoWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    window.location.href = urlFinal;
  };

  // 🌟 MODIFICACIÓN: Renderizado seguro de PayPal con retraso para asegurar que el DOM esté listo
  useEffect(() => {
    if ((paypalListo || window.paypal) && carritoAbierto && carrito.length > 0) {
      
      const timeoutId = setTimeout(() => {
        const contenedor = document.getElementById('contenedor-botones-paypal');
        
        // Verificamos que el contenedor exista y esté vacío para evitar renders múltiples
        if (contenedor && contenedor.innerHTML === '') {
          window.paypal.Buttons({
            createOrder: (data, actions) => {
              return actions.order.create({
                purchase_units: [{
                  description: "Compra unificada en Tienda RM",
                  amount: {
                    currency_code: codigoMoneda || "USD",
                    value: subtotalPrecio.toFixed(2)
                  }
                }]
              });
            },
            onApprove: async (data, actions) => {
              const order = await actions.order.capture();
              alert(`¡Pago procesado con éxito! Gracias por tu compra, ${order.payer.name.given_name}.`);
              setCarrito([]);
              setCarritoAbierto(false);
            },
            onError: (err) => {
              console.error("Error en la pasarela de PayPal:", err);
            }
          }).render('#contenedor-botones-paypal');
        }
      }, 250); // 250ms permiten que React dibuje el menú lateral completo antes de inyectar PayPal

      return () => clearTimeout(timeoutId);
    }
  }, [carritoAbierto, carrito.length, paypalListo, subtotalPrecio, codigoMoneda]);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', minHeight: '100vh', backgroundColor: '#fcfcfc', color: '#111' }}>
      
      {/* 🌟 Carga global del SDK con Client ID "test" para forzar la visualización UI */}
      <Script 
        src="https://www.paypal.com/sdk/js?client-id=test&currency=USD"
        strategy="afterInteractive"
        onLoad={() => setPaypalListo(true)}
      />

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

        {/* Menú de Escritorio */}
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
            }}>{totalArticulos}</span>
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

      {/* MENÚ MÓVIL DESPLEGABLE */}
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

      {/* PANEL LATERAL DEL CARRITO */}
      {carritoAbierto && (
        <div className="bolsa-compras-sidebar" style={{ 
          position: 'fixed', 
          top: 0, 
          right: 0, 
          height: '100vh',
          height: '100dvh',
          maxHeight: '100vh',
          maxHeight: '100dvh',
          backgroundColor: '#fff', 
          boxShadow: '-10px 0 30px rgba(0,0,0,0.08)', 
          zIndex: 200, 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}>
          {/* Encabezado fijo arriba */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: '16px', flexShrink: 0 }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: '700' }}>Tu bolsa de compras</h2>
            <button onClick={() => setCarritoAbierto(false)} style={{ background: '#f5f5f7', border: 'none', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          
          {/* Contenido Dinámico con Scroll */}
          <div className="bolsa-productos-scroll" style={{ flexGrow: 1, overflowY: 'auto', padding: '10px 2px 10px 0', minHeight: 0 }}>
            {carrito.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#86868b' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🛍️</span>
                <p style={{ margin: 0, fontSize: '1rem' }}>Tu carrito está vacío actualmente.</p>
              </div>
            ) : (
              carrito.map((item) => (
                <div key={item.variantId} style={{ display: 'flex', gap: '14px', padding: '16px 0', borderBottom: '1px solid #f5f5f7', alignItems: 'center', position: 'relative' }}>
                  <img src={item.image} alt={item.title} style={{ width: '65px', height: '65px', objectFit: 'contain', backgroundColor: '#fbfbfd', borderRadius: '8px', padding: '4px', flexShrink: 0 }} />
                  <div style={{ flexGrow: 1, paddingRight: '28px', minWidth: 0 }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</h4>
                    <span style={{ fontSize: '0.88rem', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                      {parseFloat(item.price?.amount).toFixed(2)} {item.price?.currencyCode}
                    </span>
                    {/* Controles internos del Carrito */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button onClick={() => handleModificarCantidadCarrito(item.variantId, -1)} style={{ border: '1px solid #d2d2d7', backgroundColor: '#fff', borderRadius: '4px', width: '26px', height: '26px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                      <span style={{ fontSize: '0.9rem', fontWeight: '600', minWidth: '16px', textAlign: 'center' }}>{item.cantidad}</span>
                      <button onClick={() => handleModificarCantidadCarrito(item.variantId, 1)} style={{ border: '1px solid #d2d2d7', backgroundColor: '#fff', borderRadius: '4px', width: '26px', height: '26px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleModificarCantidadCarrito(item.variantId, -item.cantidad)}
                    className="cart-remove-btn"
                    style={{
                      position: 'absolute',
                      right: '2px',
                      top: '14px',
                      background: 'none',
                      border: 'none',
                      color: '#a1a1a6',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      padding: '6px'
                    }}
                    title="Eliminar producto"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Bloque de Formulario y Cierre de Caja Independiente */}
          {carrito.length > 0 && (
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '16px', backgroundColor: '#fff', flexShrink: 0, marginTop: 'auto' }}>
              
              {/* FORMULARIO DE CLIENTE INTEGRADO */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Datos del Comprador</h4>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input 
                    type="text" 
                    placeholder="Nombre" 
                    id="cliente_nombre"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '0.9rem', boxSizing: 'border-box' }} 
                  />
                  <input 
                    type="text" 
                    placeholder="Apellido" 
                    id="cliente_apellido"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '0.9rem', boxSizing: 'border-box' }} 
                  />
                </div>
                <input 
                  type="tel" 
                  placeholder="Teléfono de contacto" 
                  id="cliente_telefono"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d2d2d7', fontSize: '0.9rem', boxSizing: 'border-box' }} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '1.1rem', fontWeight: '700' }}>
                <span>Subtotal:</span>
                <span>{subtotalPrecio.toFixed(2)} {codigoMoneda}</span>
              </div>

              {/* MÉTODO 1: WhatsApp */}
              <button 
                onClick={handleProcesarPagoWhatsApp}
                style={{ 
                  backgroundColor: '#00cc66', 
                  color: '#fff', 
                  border: 'none', 
                  padding: '13px', 
                  borderRadius: '10px', 
                  width: '100%', 
                  fontSize: '0.92rem', 
                  fontWeight: '600', 
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  marginBottom: '14px',
                  WebkitAppearance: 'none'
                }}
              >
                Confirmar Pedido por WhatsApp
              </button>

              {/* MÉTODO 2: Contenedor para inyección dinámica de los botones de PayPal */}
              <div id="contenedor-botones-paypal" style={{ minHeight: '45px', width: '100%' }}></div>

            </div>
          )}
        </div>
      )}

      {/* CUERPO CENTRAL DE LA PÁGINA */}
      <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ marginBottom: '48px', textAlign: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0066cc', display: 'block', marginBottom: '8px' }}>Nueva Colección Disponible</span>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', letterSpacing: '-1px', margin: '0 0 12px 0' }}>Explora el Catálogo Exclusivo</h2>
          <p style={{ color: '#68686e', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>Una experiencia ultra rápida conectada directamente mediante la API Headless de Shopify.</p>
        </header>

        <main>
          {!products || products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #f0f0f0' }}>
              <p style={{ color: '#86868b', fontSize: '1.1rem', margin: 0 }}>Cargando catálogo o sincronizando variables de entorno...</p>
            </div>
          ) : (
            <div className="products-grid">
              {productosOrdenados.map((product) => {
                const image = product.images?.edges?.[0]?.node;
                const price = product.priceRange?.minVariantPrice;
                const variantId = product.variants?.edges?.[0]?.node?.id;
                const cantidadElegida = cantidadesSelector[product.id] || 1;

                return (
                  <div 
                    key={product.id} 
                    className="product-card" 
                    onClick={() => setProductoSeleccionado(product)}
                    style={{ 
                      backgroundColor: '#fff', 
                      borderRadius: '16px', 
                      border: '1px solid #f0f0f0', 
                      padding: '16px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.01)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ width: '100%', height: '240px', backgroundColor: '#fbfbfd', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                      {image ? (
                        <img src={image.url} alt={image.altText || product.title} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
                      ) : (
                        <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Sin Imagen</div>
                      )}
                    </div>

                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: '0 0 8px 0', lineHeight: '1.4', color: '#111' }}>{product.title}</h3>
                    <p style={{ fontSize: '0.88rem', color: '#68686e', flexGrow: 1, margin: '0 0 16px 0', height: '40px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.5' }}>
                      {product.description || 'Sin descripción detallada disponible.'}
                    </p>
                    
                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f5f5f7', padding: '6px 12px', borderRadius: '10px', marginBottom: '16px', justifyContent: 'space-between' }}
                    >
                      <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: '500' }}>Cantidad:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button onClick={() => handleCambiarCantidadSelector(product.id, -1)} style={{ border: 'none', background: '#fff', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>-</button>
                        <span style={{ fontSize: '0.95rem', fontWeight: '700', minWidth: '16px', textAlign: 'center' }}>{cantidadElegida}</span>
                        <button onClick={() => handleCambiarCantidadSelector(product.id, 1)} style={{ border: 'none', background: '#fff', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>+</button>
                      </div>
                    </div>

                    <div 
                      onClick={(e) => e.stopPropagation()} 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid #f5f5f7' }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.75rem', color: '#86868b', textTransform: 'uppercase', fontWeight: '500' }}>Precio</span>
                        <span style={{ fontWeight: '700', fontSize: '1.2rem', color: '#000' }}>
                          {price ? `${parseFloat(price.amount).toFixed(2)} ${price.currencyCode}` : '0.00'}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleAgregarAlCarrito(product, variantId)}
                        style={{ 
                          backgroundColor: '#001122', 
                          color: '#fff', 
                          border: 'none',
                          padding: '10px 18px', 
                          borderRadius: '10px',  
                          fontSize: '0.88rem',
                          fontWeight: '600',
                          transition: 'background-color 0.2s ease',
                          cursor: 'pointer' 
                        }}
                      >
                        Añadir a bolsa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* MODAL INTERACTIVO CON RENDERIZADO DE HTML ESTRUCTURADO */}
      {productoSeleccionado && (
        <div 
          onClick={() => setProductoSeleccionado(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100vh',
            height: '100dvh',
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#fff',
              borderRadius: '20px',
              maxWidth: '650px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '32px',
              boxSizing: 'border-box',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              position: 'relative'
            }}
          >
            <button 
              onClick={() => setProductoSeleccionado(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#f5f5f7',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>

            <div style={{ width: '100%', height: '280px', backgroundColor: '#fbfbfd', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              {productoSeleccionado.images?.edges?.[0]?.node?.url ? (
                <img 
                  src={productoSeleccionado.images.edges[0].node.url} 
                  alt={productoSeleccionado.images.edges[0].node.altText || productoSeleccionado.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '16px' }} 
                />
              ) : (
                <div style={{ color: '#aaa', fontSize: '0.9rem' }}>Sin Imagen</div>
              )}
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0 0 12px 0', color: '#111', lineHeight: '1.3' }}>
              {productoSeleccionado.title}
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '0.8rem', color: '#86868b', textTransform: 'uppercase', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Precio</span>
              <span style={{ fontWeight: '800', fontSize: '1.5rem', color: '#0066cc' }}>
                {productoSeleccionado.priceRange?.minVariantPrice 
                  ? `${parseFloat(productoSeleccionado.priceRange.minVariantPrice.amount).toFixed(2)} ${productoSeleccionado.priceRange.minVariantPrice.currencyCode}`
                  : '0.00'}
              </span>
            </div>

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '20px' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', fontWeight: '700', textTransform: 'uppercase', color: '#111', letterSpacing: '0.5px' }}>Descripción completa</h4>
              
              {productoSeleccionado.descriptionHtml ? (
                <div 
                  className="shopify-html-content"
                  dangerouslySetInnerHTML={{ __html: productoSeleccionado.descriptionHtml }}
                />
              ) : (
                <p style={{ fontSize: '0.95rem', color: '#444', lineHeight: '1.6', margin: 0 }}>
                  {productoSeleccionado.description || 'Sin descripción detallada disponible.'}
                </p>
              )}
            </div>

            <button 
              onClick={() => {
                const variantId = productoSeleccionado.variants?.edges?.[0]?.node?.id;
                handleAgregarAlCarrito(productoSeleccionado, variantId);
                setProductoSeleccionado(null);
              }}
              style={{
                marginTop: '28px',
                backgroundColor: '#111',
                color: '#fff',
                border: 'none',
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease'
              }}
            >
              Añadir a bolsa de compras
            </button>
          </div>
        </div>
      )}

      {/* SECCIÓN DE ESTILOS ADAPTIVOS Y FORMATEO DE CONTENIDO */}
      <style jsx global>{`
        .shopify-html-content {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #333;
        }
        .shopify-html-content p {
          margin: 0 0 14px 0;
        }
        .shopify-html-content strong {
          color: #000;
          font-weight: 700;
        }
        .shopify-html-content a {
          color: #0066cc;
          text-decoration: none;
          word-break: break-all;
        }
        .shopify-html-content a:hover {
          text-decoration: underline;
        }
        .shopify-html-content ul, .shopify-html-content ol {
          margin: 0 0 16px 0;
          padding-left: 20px;
        }
        .shopify-html-content li {
          margin-bottom: 6px;
        }

        /* MANEJO ABSOLUTO DE ANCHOS MEDIANTE CSS PURO */
        @media (max-width: 540px) {
          .bolsa-compras-sidebar {
            width: 100% !important;
          }
        }
        @media (min-width: 541px) and (max-width: 1023px) {
          .bolsa-compras-sidebar {
            width: 380px !important;
          }
        }
        @media (min-width: 1024px) {
          .bolsa-compras-sidebar {
            width: 420px !important;
          }
        }

        /* SCROLLBAR MINIMALISTA */
        .bolsa-productos-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .bolsa-productos-scroll::-webkit-scrollbar-track {
          background: #ffffff;
        }
        .bolsa-productos-scroll::-webkit-scrollbar-thumb {
          background: #e2e2e7;
          border-radius: 10px;
        }
        .bolsa-productos-scroll::-webkit-scrollbar-thumb:hover {
          background: #d2d2d7;
        }
        .bolsa-productos-scroll {
          scrollbar-width: thin;
          scrollbar-color: #e2e2e7 #ffffff;
          -webkit-overflow-scrolling: touch;
        }

        /* Configuración de la cuadrícula adaptiva */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 28px;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 20px -3px rgba(0, 0, 0, 0.04) !important;
          border-color: #e2e2e7 !important;
        }
        .cart-remove-btn:hover {
          color: #ff3b30 !important;
        }

        /* Menú de Escritorio vs Móvil */
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