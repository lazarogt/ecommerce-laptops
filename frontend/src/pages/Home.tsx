import React, { useEffect, useState } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import type { Product } from "../types/product";

const Home: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:3000/api/products");
        // Ajustamos según tu backend
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

  if (loading) return <p>Cargando productos...</p>;
  if (!products.length) return <p>No hay productos disponibles 😅</p>;

  return (
    <div>
      <h1>Productos disponibles</h1>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {products.map((product) => (
          <li
            key={product.id}
            style={{
              marginBottom: "20px",
              border: "1px solid #ccc",
              padding: "15px",
              borderRadius: "8px",
              boxShadow: "2px 2px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h2>{product.name}</h2>
            <p>{product.description || "Sin descripción"}</p>
            <p>Precio: ${product.price.toFixed(2)}</p>
            <p>Stock: {product.stock}</p>

            <button
              onClick={() => {
                addToCart(product);
                alert(`${product.name} añadido al carrito ✅`);
              }}
              style={{
                padding: "8px 12px",
                borderRadius: "5px",
                backgroundColor: "#4caf50",
                color: "#fff",
                border: "none",
                cursor: "pointer",
              }}
            >
              Añadir al carrito
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;