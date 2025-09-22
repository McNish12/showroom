import PropTypes from 'prop-types'
import { useRef } from 'react'
import useFocusTrap from '../hooks/useFocusTrap'

const ImageModal = ({ image, onClose }) => {
  const modalRef = useRef(null)
  const isOpen = Boolean(image)
  useFocusTrap(modalRef, isOpen, { onEscape: onClose })

  if (!image) return null

  const { src, alt } = image

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-slate-900/70" onClick={onClose} aria-hidden="true" />
      <div
        ref={modalRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Expanded product image"
        className="relative z-50 w-[min(90vw,48rem)] max-w-full rounded-2xl bg-white p-6 shadow-2xl outline-none"
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            aria-label="Close image"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ×
            </span>
          </button>
        </div>
        <div className="mt-4 flex max-h-[70vh] items-center justify-center overflow-hidden rounded-xl bg-slate-50 p-4">
          <img src={src} alt={alt || 'Expanded product image'} className="max-h-[60vh] w-full object-contain" />
        </div>
      </div>
    </div>
  )
}

ImageModal.propTypes = {
  image: PropTypes.shape({
    src: PropTypes.string.isRequired,
    alt: PropTypes.string,
    trigger: PropTypes.shape({ focus: PropTypes.func }),
  }),
  onClose: PropTypes.func,
}

ImageModal.defaultProps = {
  image: null,
  onClose: undefined,
}

export default ImageModal
