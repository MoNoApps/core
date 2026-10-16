import React, { useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export interface ModalProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  subtitle,
  icon,
  onClose,
  children,
  size = "md",
}) => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (!isOpen) return;

    // Lock background scroll when modal is active
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidth = size === "sm" ? 420 : size === "lg" ? 780 : 560;

  return (
    <div
      className="modal-backdrop-custom"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading-title"
    >
      <div
        className={`modal-card-custom ${isDarkMode ? "dark-theme" : ""}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-custom">
          <div className="modal-header-left">
            {icon && <div className="modal-icon-badge">{icon}</div>}
            <div>
              <h3 id="modal-heading-title" className="modal-title-custom">
                {title}
              </h3>
              {subtitle && <p className="modal-subtitle-custom">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-body-custom">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
