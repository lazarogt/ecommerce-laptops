// src/components/ProductCard.tsx
import React from 'react';
import type { Product } from '../types/product';
import { useCart } from '../context/CartContext';

interface Props { product: Product; }

const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCart();
  return (
    <div className="border rounded p-4 shadow hover:shadow-lg flex flex-col">
      <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
        {product.image ? (
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-500">Imagen no disponible</div>
        )}
      </div>
      <h3 className="mt-3 font-semibold text-lg">{product.name}</h3>
      {product.description && <p className="text-sm text-gray-600 mt-1">{product.description}</p>}
      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-xl">${product.price.toFixed(2)}</span>
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          onClick={() => addToCart(product)}
        >
          Añadir
        </button>
      </div>
    </div>
  );
};

export default ProductCard;