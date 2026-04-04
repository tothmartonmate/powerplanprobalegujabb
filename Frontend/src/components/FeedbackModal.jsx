import React from 'react';
import './FeedbackModal.css';

function FeedbackModal({
  isOpen,
  type = 'success',
  title,
  message,
  confirmLabel = 'Rendben',
  onConfirm,
  onClose,
  closeOnBackdrop = true
}) {
  if (!isOpen) return null;

  const modalContentByType = {
    success: {
      icon: 'fas fa-check',
      iconLabel: 'Siker'
    },
    error: {
      icon: 'fas fa-times',
      iconLabel: 'Hiba'
    },
    warning: {
      icon: 'fas fa-exclamation',
      iconLabel: 'Figyelmeztetes'
    },
    info: {
      icon: 'fas fa-info',
      iconLabel: 'Informacio'
    }
  };

  const modalVisual = modalContentByType[type] || modalContentByType.info;
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
      return;
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-modal-title">
      <div
        className="feedback-modal__backdrop"
        onClick={closeOnBackdrop ? handleConfirm : undefined}
      ></div>
      <div className={`feedback-modal__content feedback-modal__content--${type}`}>
        <div className={`feedback-modal__icon feedback-modal__icon--${type}`} aria-label={modalVisual.iconLabel}>
          <i className={modalVisual.icon}></i>
        </div>
        <h3 id="feedback-modal-title">{title}</h3>
        <p>{message}</p>
        <button type="button" className={`feedback-modal__button feedback-modal__button--${type}`} onClick={handleConfirm}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

export default FeedbackModal;