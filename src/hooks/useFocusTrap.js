import { useEffect } from 'react'

const FOCUSABLE_SELECTORS =
  'a[href],area[href],button:not([disabled]),iframe,input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'

const isElementVisible = (element) => {
  if (!element) return false
  if (element.offsetParent !== null) return true
  if (typeof element.getBoundingClientRect === 'function') {
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }
  return true
}

const getFocusableElements = (container) => {
  if (!container) return []
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
    (element) => !element.hasAttribute('disabled') && isElementVisible(element),
  )
}

const focusFirstElement = (container) => {
  const focusable = getFocusableElements(container)
  if (focusable.length > 0) {
    focusable[0].focus({ preventScroll: true })
  } else if (container && typeof container.focus === 'function') {
    container.focus({ preventScroll: true })
  }
}

const useFocusTrap = (ref, active, { onEscape } = {}) => {
  useEffect(() => {
    if (!active) return undefined
    const container = ref?.current
    if (!container) return undefined

    focusFirstElement(container)

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape?.()
        return
      }

      if (event.key !== 'Tab') return

      const focusable = getFocusableElements(container)
      if (focusable.length === 0) {
        event.preventDefault()
        container.focus({ preventScroll: true })
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (event.shiftKey) {
        if (current === first || !container.contains(current)) {
          event.preventDefault()
          last.focus({ preventScroll: true })
        }
      } else if (current === last) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    const handleFocusIn = (event) => {
      if (!container.contains(event.target)) {
        focusFirstElement(container)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('focusin', handleFocusIn)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('focusin', handleFocusIn)
    }
  }, [ref, active, onEscape])
}

export default useFocusTrap
