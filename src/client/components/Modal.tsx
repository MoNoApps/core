import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  onClose,
  children,
  size = "md",
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidth = size === "sm" ? 400 : size === "lg" ? 800 : 560;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.55)",
        zIndex: 1050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        overflowY: "auto",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: "100%",
          maxWidth,
          borderRadius: 6,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-header"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
          }}
        >
          <h4 className="modal-title" style={{ margin: 0, fontWeight: 600 }}>
            {title}
          </h4>
          <button
            type="button"
            className="close"
            onClick={onClose}
            style={{
              fontSize: 20,
              cursor: "pointer",
              border: "none",
              background: "none",
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div className="modal-body" style={{ padding: 20 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
