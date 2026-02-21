import React, { useEffect, useState } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import type { Product } from "../types/product";
import "./Home.css";

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null); // para animación +1
  const { addToCart, items } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("/api/products");
        if (res.data && res.data.data) {
          setProducts(res.data.data);
        } else {
          console.error("Backend no devolvió products:", res.data);
        }
      } catch (err) {
        console.error("Error cargando productos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const getCartQuantity = (productId: string) => {
    const item = items.find(i => i.productId === productId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 800); // animación dura 0.8s
  };

  if (loading) return <p style={{ textAlign: "center" }}>Cargando productos...</p>;
  if (!products.length) return <p style={{ textAlign: "center" }}>No hay productos disponibles 😅</p>;

  return (
    <div className="home-container">
      <h1>Productos disponibles</h1>
      <div className="products-grid">
        {products.map(product => {
          const cartQty = getCartQuantity(product.id);
          const isAdded = addedId === product.id;

          return (
            <div key={product.id} className="product-card">
              <div className="product-image">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className="no-image">Sin imagen</div>
                )}
              </div>

              <div className="product-info">
                <h2 className="product-name">{product.name}</h2>
                <p className="product-desc">
                  {product.description
                    ? product.description.slice(0, 80) + (product.description.length > 80 ? "..." : "")
                    : "Sin descripción"}
                </p>
                <p className="product-price">${product.price.toFixed(2)}</p>
                <p className="product-stock">Stock: {product.stock}</p>

                {cartQty > 0 && (
                  <p className="cart-qty">En carrito: {cartQty}</p>
                )}

                <button
                  disabled={product.stock === 0}
                  onClick={() => handleAddToCart(product)}
                  className="add-to-cart-btn"
                >
                  {product.stock === 0 ? "Agotado" : "Añadir al carrito"}
                  {isAdded && <span className="plus-one">+1</span>}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Home;