import { useEffect } from 'react'

/**
 * useStaffProtection
 *
 * Applies browser-level copy/screenshot deterrents when the current user
 * is a staff account. Call this hook at the top of any page a staff user
 * can access.
 *
 * What it blocks (browser layer):
 *  - Right-click context menu
 *  - Ctrl/Cmd + C  (copy)
 *  - Ctrl/Cmd + A  (select all)
 *  - Ctrl/Cmd + S  (save page)
 *  - Ctrl/Cmd + P  (print)
 *  - Ctrl/Cmd + Shift + S  (screenshot on some OS)
 *  - PrintScreen key
 *  - Text selection via CSS user-select: none
 *  - Image drag
 *
 * Note: OS-level screenshots (Win+Shift+S, phone camera) cannot be
 * blocked from the browser. This covers the common casual cases.
 */
export function useStaffProtection() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isStaff = user?.role === 'staff'

  useEffect(() => {
    if (!isStaff) return

    // ── CSS: disable text selection and image drag ──────────────────────
    const style = document.createElement('style')
    style.id = 'staff-protection-style'
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      img {
        pointer-events: none !important;
        -webkit-user-drag: none !important;
        user-drag: none !important;
      }
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        user-select: text !important;
      }
    `
    document.head.appendChild(style)

    // ── Block right-click context menu ──────────────────────────────────
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // ── Block keyboard shortcuts ────────────────────────────────────────
    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey

      // PrintScreen
      if (key === 'printscreen') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }

      if (ctrl) {
        // Copy, Select All, Save, Print, Screenshot shortcut
        if (['c', 'a', 's', 'p'].includes(key)) {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
        // Ctrl+Shift+S (some screenshot tools)
        if (e.shiftKey && key === 's') {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }
    }

    // ── Block drag-start on images ──────────────────────────────────────
    const blockDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault()
      }
    }

    // ── Block copy event directly ───────────────────────────────────────
    const blockCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    document.addEventListener('contextmenu', blockContextMenu)
    document.addEventListener('keydown', blockKeys, true)
    document.addEventListener('dragstart', blockDragStart)
    document.addEventListener('copy', blockCopy)

    return () => {
      // Cleanup on unmount
      const injected = document.getElementById('staff-protection-style')
      if (injected) injected.remove()
      document.removeEventListener('contextmenu', blockContextMenu)
      document.removeEventListener('keydown', blockKeys, true)
      document.removeEventListener('dragstart', blockDragStart)
      document.removeEventListener('copy', blockCopy)
    }
  }, [isStaff])
}