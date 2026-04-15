import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppLayout } from '../components/layout/LayoutContext'
import {
  applyActiveVersionFields,
  buildSnippetFromBody,
  loadMockDrafts,
  persistMockDrafts,
} from '../lib/mockDrafts'
import { appendMockAuditLog } from '../lib/mockAuditLogs'
import { loadMockUsers } from '../lib/mockUsers'
import { getSession } from '../lib/session'

const SAVE_DELAY_MS = 500

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function toEditorHtml(raw) {
  const s = String(raw ?? '')
  if (!s.trim()) return ''
  // Heuristic: preserve existing rich-text HTML; otherwise treat as plain text.
  if (/[<>]/.test(s) && /<\/?[a-z][\s\S]*>/i.test(s)) return s
  return escapeHtml(s).replace(/\n/g, '<br />')
}

function htmlToPlainText(html) {
  try {
    const el = document.createElement('div')
    el.innerHTML = String(html ?? '')
    return el.textContent ?? ''
  } catch {
    return String(html ?? '')
  }
}

/**
 * @param {string | null} draftIdFromUrl
 * @returns {{
 *   title: string,
 *   description: string,
 *   body: string,
 *   currentDraftId: string | null,
 *   hasSavedOnce: boolean,
 *   bootToast: string | null,
 * }}
 */
function readEditorSnapshot(draftIdFromUrl) {
  const session = getSession()
  if (!draftIdFromUrl || !session?.userId) {
    return {
      title: '',
      description: '',
      body: '',
      currentDraftId: null,
      hasSavedOnce: false,
      bootToast: null,
    }
  }

  const list = loadMockDrafts()
  const found = list.find((d) => d.id === draftIdFromUrl)
  if (!found) {
    return {
      title: '',
      description: '',
      body: '',
      currentDraftId: null,
      hasSavedOnce: false,
      bootToast: 'Draft not found.',
    }
  }

  const bodyText =
    typeof found.body === 'string' && found.body.length > 0 ? found.body : (found.snippet ?? '')

  return {
    title: found.title ?? '',
    description: typeof found.description === 'string' ? found.description : '',
    body: bodyText,
    currentDraftId: found.id,
    hasSavedOnce: true,
    bootToast: null,
  }
}

function useConfirmLeave(isDirty, navigateToDrafts) {
  return useCallback(() => {
    if (isDirty) {
      const ok = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?',
      )
      if (!ok) return false
    }
    navigateToDrafts()
    return true
  }, [isDirty, navigateToDrafts])
}

function FormatMockButton({ label, title: tip, onClick }) {
  return (
    <button
      type="button"
      title={tip}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
    >
      {label}
    </button>
  )
}

/** @param {{ draftIdFromUrl: string | null }} props */
function NewDocumentWorkspace({ draftIdFromUrl }) {
  const navigate = useNavigate()
  const boot = readEditorSnapshot(draftIdFromUrl)

  const [title, setTitle] = useState(boot.title)
  const [description, setDescription] = useState(boot.description)
  const [body, setBody] = useState(toEditorHtml(boot.body))
  const [isDirty, setIsDirty] = useState(false)
  const [hasSavedOnce, setHasSavedOnce] = useState(boot.hasSavedOnce)
  const [currentDraftId, setCurrentDraftId] = useState(boot.currentDraftId)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(/** @type {string | null} */ (boot.bootToast))
  const [bodyHasSelection, setBodyHasSelection] = useState(false)
  const [toolbarPos, setToolbarPos] = useState(
    /** @type {{ top: number; left: number } | null} */ (null),
  )
  const [listType, setListType] = useState('')

  const titleRef = useRef(/** @type {HTMLTextAreaElement | null} */ (null))
  const editorRef = useRef(/** @type {HTMLDivElement | null} */ (null))

  useLayoutEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [title])

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    function onBeforeUnload(e) {
      if (!isDirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  useLayoutEffect(() => {
    const el = editorRef.current
    if (!el) return
    el.innerHTML = body
  }, [])

  const goDrafts = useCallback(() => {
    navigate('/my-drafts')
  }, [navigate])

  const tryLeave = useConfirmLeave(isDirty, goDrafts)

  const refreshSelectionAndToolbar = useCallback(() => {
    const root = editorRef.current
    if (!root) {
      setBodyHasSelection(false)
      setToolbarPos(null)
      return
    }
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) {
      setBodyHasSelection(false)
      setToolbarPos(null)
      return
    }
    const range = sel.getRangeAt(0)
    const anchorNode = sel.anchorNode
    const focusNode = sel.focusNode
    const within =
      (anchorNode && root.contains(anchorNode)) || (focusNode && root.contains(focusNode))
    if (!within) {
      setBodyHasSelection(false)
      setToolbarPos(null)
      return
    }
    if (range.collapsed) {
      setBodyHasSelection(false)
      setToolbarPos(null)
      return
    }
    setBodyHasSelection(true)
    const rect = range.getBoundingClientRect()
    const GAP = 8
    setToolbarPos({
      top: rect.top - GAP,
      left: rect.left + rect.width / 2,
    })
  }, [])

  useEffect(() => {
    const onSel = () => refreshSelectionAndToolbar()
    document.addEventListener('selectionchange', onSel)
    return () => document.removeEventListener('selectionchange', onSel)
  }, [refreshSelectionAndToolbar])

  useEffect(() => {
    if (!bodyHasSelection) return undefined
    const onScrollOrResize = () => refreshSelectionAndToolbar()
    window.addEventListener('scroll', onScrollOrResize, true)
    window.addEventListener('resize', onScrollOrResize)
    const el = editorRef.current
    el?.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true)
      window.removeEventListener('resize', onScrollOrResize)
      el?.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [bodyHasSelection, refreshSelectionAndToolbar])

  function syncBodyFromEditor() {
    const el = editorRef.current
    if (!el) return
    setBody(el.innerHTML)
  }

  function exec(cmd) {
    const el = editorRef.current
    if (!el) return
    el.focus()
    // eslint-disable-next-line deprecation/deprecation
    document.execCommand(cmd)
    syncBodyFromEditor()
    setIsDirty(true)
    refreshSelectionAndToolbar()
  }

  function handleSaveDraft() {
    if (saving) return
    const session = getSession()
    if (!session?.userId) {
      setToast('Could not save: sign in required.')
      return
    }
    setSaving(true)
    window.setTimeout(() => {
      const list = loadMockDrafts()
      const now = new Date().toISOString()
      const snippet = buildSnippetFromBody(htmlToPlainText(body))
      const displayTitle = title.trim() || 'Untitled document'
      const dirAuthor = loadMockUsers().find((u) => u.id === session.userId)
      const authorSnapshot = dirAuthor
        ? { id: dirAuthor.id, username: dirAuthor.username, name: dirAuthor.name }
        : {
            id: session.userId,
            username: String(session.username ?? ''),
            name: session.displayName ?? 'Author',
          }

      if (currentDraftId) {
        const next = list.map((d) => {
          if (d.id !== currentDraftId) return d
          const merged = applyActiveVersionFields(d, {
            title: displayTitle,
            snippet,
            description: description.trim(),
            body,
          })
          return {
            ...merged,
            author: merged.author ?? authorSnapshot,
            authorId: (merged.author ?? authorSnapshot).id,
            authorName: (merged.author ?? authorSnapshot).name,
            updatedAt: now,
            lastEditedLabel: 'Just now',
          }
        })
        persistMockDrafts(next)
        appendMockAuditLog({
          actorUserId: session.userId,
          actorDisplayName: session.displayName ?? session.userId,
          action: `Updated draft "${displayTitle}"`,
          category: 'DOCUMENT',
          type: 'INFO',
          details: { documentId: currentDraftId, newValue: { lastSaved: true } },
        })
      } else {
        const id = `draft_${Date.now()}`
        const vid = `ver_${id}_1`
        const newDoc = {
          id,
          title: displayTitle,
          status: 'DRAFT',
          snippet,
          updatedAt: now,
          lastEditedLabel: 'Just now',
          author: authorSnapshot,
          authorId: authorSnapshot.id,
          authorName: authorSnapshot.name,
          description: description.trim(),
          body,
          versions: [
            {
              id: vid,
              versionNumber: 1,
              createdAt: now,
              title: displayTitle,
              body,
              description: description.trim(),
              snippet,
            },
          ],
          activeVersionId: vid,
        }
        persistMockDrafts([newDoc, ...list])
        appendMockAuditLog({
          actorUserId: session.userId,
          actorDisplayName: session.displayName ?? session.userId,
          action: `Created draft "${displayTitle}"`,
          category: 'DOCUMENT',
          type: 'INFO',
          details: { documentId: id, newValue: { status: 'DRAFT' } },
        })
        setCurrentDraftId(id)
        navigate('/my-drafts')
      }

      setSaving(false)
      setIsDirty(false)
      setHasSavedOnce(true)
      setToast('Document saved successfully!')
    }, SAVE_DELAY_MS)
  }

  function handleCancel() {
    tryLeave()
  }

  function handleBack() {
    tryLeave()
  }

  const statusText = isDirty
    ? 'Status: Unsaved changes'
    : hasSavedOnce
      ? 'Saved just now'
      : 'Status: Unsaved'

  return (
    <>
      <header className="sticky top-0 z-30 grid grid-cols-[auto_1fr_auto] items-center gap-2 border-b border-transparent bg-white/80 px-2 py-3 backdrop-blur-md sm:px-3 sm:py-3.5">
        <button
          type="button"
          onClick={handleBack}
          className="shrink-0 justify-self-start whitespace-nowrap text-sm font-medium text-slate-600 transition hover:text-slate-900"
        >
          ← Back to Drafts
        </button>
        <p className="min-w-0 justify-self-center text-center text-sm text-slate-500">{statusText}</p>
        <div className="flex items-center justify-end gap-2 sm:justify-self-end sm:gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-2 py-1.5 text-sm text-slate-500 transition hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveDraft}
            className="rounded-xl bg-green-100 px-4 py-2 text-sm font-semibold text-green-800 shadow-sm ring-1 ring-green-200/80 transition hover:bg-green-200 hover:text-green-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : hasSavedOnce ? 'Update Draft' : 'Save as Draft'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center px-0 pb-16 pt-6 md:pt-10">
        <div className="relative w-full max-w-3xl rounded-2xl bg-white p-8 shadow-md md:p-12 lg:p-16">
          {bodyHasSelection && toolbarPos ? (
            <div
              className="fixed z-50 -translate-x-1/2 -translate-y-full"
              style={{ top: toolbarPos.top, left: toolbarPos.left }}
              onMouseDown={(e) => {
                const tag = e.target?.tagName
                if (tag === 'SELECT' || tag === 'OPTION') return
                e.preventDefault()
              }}
            >
              <div
                className="flex items-center gap-0.5 rounded-full border border-slate-200/90 bg-white/95 px-1.5 py-1 shadow-md backdrop-blur-sm"
                role="toolbar"
                aria-label="Formatting (mock)"
              >
                <FormatMockButton
                  label="B"
                  title="Bold"
                  onClick={() => exec('bold')}
                />
                <FormatMockButton
                  label="I"
                  title="Italic"
                  onClick={() => exec('italic')}
                />
                <FormatMockButton
                  label="U"
                  title="Underline"
                  onClick={() => exec('underline')}
                />
                <span className="mx-0.5 h-5 w-px bg-slate-200" aria-hidden />
                <div className="relative">
                  <select
                    aria-label="List type"
                    value={listType}
                    onChange={(e) => {
                      const v = e.target.value
                      if (v === 'bullets') exec('insertUnorderedList')
                      else if (v === 'numbers') exec('insertOrderedList')
                      setListType('')
                    }}
                    className="h-8 cursor-pointer appearance-none rounded-lg bg-transparent px-3 pr-8 text-xs font-semibold text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-900"
                  >
                    <option value="" disabled>
                      List Type…
                    </option>
                    <option value="bullets">Bullets</option>
                    <option value="numbers">Numbers</option>
                  </select>
                  <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-slate-400">
                    ▾
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <label htmlFor="doc-title" className="sr-only">
            Document title
          </label>
          <textarea
            id="doc-title"
            ref={titleRef}
            value={title}
            rows={2}
            onChange={(e) => {
              setTitle(e.target.value)
              setIsDirty(true)
            }}
            placeholder="Enter document title..."
            className="min-h-0 w-full resize-none overflow-hidden border-0 bg-transparent text-4xl font-bold tracking-tight text-slate-900 outline-none ring-0 whitespace-pre-wrap break-words placeholder:text-slate-300 focus:ring-0"
          />

          <label htmlFor="doc-description" className="sr-only">
            Short summary
          </label>
          <textarea
            id="doc-description"
            value={description}
            rows={2}
            onChange={(e) => {
              setDescription(e.target.value)
              setIsDirty(true)
            }}
            placeholder="Short summary (optional)..."
            className="mt-4 min-h-0 w-full resize-none border-0 bg-transparent text-lg italic leading-snug text-slate-800 outline-none ring-0 whitespace-pre-wrap break-words placeholder:text-slate-300 focus:ring-0"
          />

          <label htmlFor="doc-body" className="sr-only">
            Document body
          </label>
          <div
            id="doc-body"
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            onInput={() => {
              syncBodyFromEditor()
              setIsDirty(true)
            }}
            onBlur={() => {
              syncBodyFromEditor()
            }}
            onMouseUp={() => {
              refreshSelectionAndToolbar()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Tab') {
                e.preventDefault()
                editorRef.current?.focus()
                /* eslint-disable deprecation/deprecation -- execCommand for indent/outdent in contentEditable */
                if (e.shiftKey) document.execCommand('outdent')
                else document.execCommand('indent')
                /* eslint-enable deprecation/deprecation */
                syncBodyFromEditor()
                setIsDirty(true)
                refreshSelectionAndToolbar()
                return
              }
              const isMod = e.ctrlKey || e.metaKey
              if (!isMod) return
              const k = String(e.key || '').toLowerCase()
              if (k === 'b') {
                e.preventDefault()
                exec('bold')
              } else if (k === 'i') {
                e.preventDefault()
                exec('italic')
              } else if (k === 'u') {
                e.preventDefault()
                exec('underline')
              }
            }}
            className="mt-8 min-h-[50vh] w-full rounded-xl border border-transparent bg-transparent p-0 text-lg leading-relaxed text-slate-800 outline-none ring-0 focus:border-slate-200 focus:bg-white/40 focus:ring-2 focus:ring-slate-100 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-2 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-2 [&_li]:mb-1"
            data-placeholder="Start typing your document..."
          />
          <style>{`
            #doc-body:empty:before {
              content: attr(data-placeholder);
              color: rgb(203 213 225);
            }
          `}</style>
        </div>
      </div>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast}
            role="status"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-6 left-1/2 z-[60] max-w-[min(92vw,22rem)] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  )
}

export default function NewDocument() {
  const [searchParams] = useSearchParams()
  const draftIdFromUrl = searchParams.get('id')
  const { sidebarCollapsed, setSidebarCollapsed } = useAppLayout()
  const sidebarRestoreRef = useRef(sidebarCollapsed)

  useLayoutEffect(() => {
    const restoreCollapsed = sidebarRestoreRef.current
    setSidebarCollapsed(true)
    return () => {
      setSidebarCollapsed(restoreCollapsed)
    }
  }, [setSidebarCollapsed])

  return (
    <motion.div
      key={draftIdFromUrl ?? '__new__'}
      className="flex min-h-[calc(100dvh-8rem)] flex-col bg-[#F7F9FC]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <NewDocumentWorkspace draftIdFromUrl={draftIdFromUrl} />
    </motion.div>
  )
}
