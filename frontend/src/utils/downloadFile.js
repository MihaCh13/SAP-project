function safeFileName(raw) {
  const base = String(raw ?? 'document').trim() || 'document'
  return base.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\s+/g, '_')
}

function triggerBlobDownload(content, filename, mimeType) {
  const blob = new Blob([String(content ?? '')], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderToPrintFrame(title, htmlContent) {
  const safeTitle = escapeHtml(title || 'Document')
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  iframe.style.position = 'fixed'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  iframe.style.opacity = '0'
  iframe.style.pointerEvents = 'none'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  const frameWindow = iframe.contentWindow
  if (!doc || !frameWindow) {
    iframe.remove()
    throw new Error('Unable to open print frame.')
  }

  doc.open()
  doc.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${safeTitle}</title>
        <style>
          @page { margin: 18mm; }
          body {
            font-family: "Segoe UI", Arial, sans-serif;
            color: #0f172a;
            line-height: 1.55;
            margin: 0;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 14px;
            padding-bottom: 10px;
            border-bottom: 1px solid #cbd5e1;
          }
          img, table {
            max-width: 100%;
          }
          p, ul, ol {
            margin: 0 0 12px;
          }
        </style>
      </head>
      <body>
        <h1>${safeTitle}</h1>
        <div>${String(htmlContent ?? '')}</div>
      </body>
    </html>
  `)
  doc.close()

  const cleanup = () => {
    frameWindow.removeEventListener('afterprint', cleanup)
    iframe.remove()
  }

  frameWindow.addEventListener('afterprint', cleanup)
  window.setTimeout(cleanup, 1500)
  frameWindow.focus()
  frameWindow.print()
}

/**
 * @param {string} content
 * @param {string} title
 * @param {'PDF' | 'TXT'} type
 */
export function downloadFile(content, title, type) {
  const fileName = safeFileName(title)
  if (type === 'TXT') {
    triggerBlobDownload(content, `${fileName}.txt`, 'text/plain;charset=utf-8')
    return
  }

  renderToPrintFrame(title, content)
}
