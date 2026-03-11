import { useEffect } from 'react'

export function useStaffProtection() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isStaff = user?.role === 'staff'

  useEffect(() => {
    if (!isStaff) return

    // ── CSS: disable text selection and image drag ──────────────
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

    // ── Black overlay element ────────────────────────────────────
    const overlay = document.createElement('div')
    overlay.id = 'staff-screenshot-shield'
    Object.assign(overlay.style, {
      position:        'fixed',
      inset:           '0',
      zIndex:          '2147483647',        // max z-index
      background:      '#000',
      display:         'none',
      alignItems:      'center',
      justifyContent:  'center',
      flexDirection:   'column',
      gap:             '12px',
      color:           '#fff',
      fontSize:        '15px',
      fontFamily:      'system-ui, sans-serif',
      letterSpacing:   '0.01em',
    })
    overlay.innerHTML = `
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
        stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <span style="font-weight:600">Screen Protected</span>
      <span style="font-size:12px;opacity:0.5">Return to the app to continue</span>
    `
    document.body.appendChild(overlay)

    const showOverlay = () => {
      overlay.style.display = 'flex'
    }
    const hideOverlay = () => {
      overlay.style.display = 'none'
    }

    // ── Triggers ─────────────────────────────────────────────────
    // window blur catches: Win+Shift+S snipping tool, Alt+Tab,
    // any screenshot tool that steals window focus
    window.addEventListener('blur', showOverlay)
    window.addEventListener('focus', hideOverlay)

    // visibilitychange catches: tab switch, minimize
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') showOverlay()
      else hideOverlay()
    }
    document.addEventListener('visibilitychange', handleVisibility)

    // ── Block right-click ────────────────────────────────────────
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // ── Block keyboard shortcuts ─────────────────────────────────
    const blockKeys = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const ctrl = e.ctrlKey || e.metaKey

      if (key === 'printscreen') {
        e.preventDefault()
        e.stopPropagation()
        // Immediately black out on PrintScreen press
        showOverlay()
        setTimeout(hideOverlay, 2000)
        return false
      }

      if (ctrl) {
        if (['c', 'a', 's', 'p'].includes(key)) {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
        if (e.shiftKey && key === 's') {
          e.preventDefault()
          e.stopPropagation()
          return false
        }
      }
    }

    // ── Block drag + copy ────────────────────────────────────────
    const blockDragStart = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') e.preventDefault()
    }
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
      document.getElementById('staff-protection-style')?.remove()
      document.getElementById('staff-screenshot-shield')?.remove()
      window.removeEventListener('blur', showOverlay)
      window.removeEventListener('focus', hideOverlay)
      document.removeEventListener('visibilitychange', handleVisibility)
      document.removeEventListener('contextmenu', blockContextMenu)
      document.removeEventListener('keydown', blockKeys, true)
      document.removeEventListener('dragstart', blockDragStart)
      document.removeEventListener('copy', blockCopy)
    }
  }, [isStaff])
}