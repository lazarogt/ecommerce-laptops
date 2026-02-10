import { useCart } from "../context/CartContext";

export default function CartButton({ onClick }: { onClick: () => void }) {
  const { items } = useCart();

  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        background: "#111",
        color: "#fff",
        borderRadius: "50%",
        width: "48px",
        height: "48px",
        cursor: "pointer",
        border: "none",
        fontSize: "18px"
      }}
    >
      🛒
      {items.length > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-6px",
            right: "-6px",
            background: "red",
            color: "white",
            borderRadius: "50%",
            padding: "2px 6px",
            fontSize: "12px"
          }}
        >
          {items.length}
        </span>
      )}
    </button>
  );
}