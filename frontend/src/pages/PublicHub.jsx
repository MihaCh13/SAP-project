import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DocumentDrawer from '../components/DocumentDrawer'

const cardShadow = 'shadow-[0_4px_28px_-6px_rgba(15,23,42,0.1)]'

/** @typedef {{ id: string, title: string, author: string, approvedAt: string, approvedLabel: string, content: string, status: 'APPROVED' }} PublicDoc */

/** @type {PublicDoc[]} */
const MOCK_PUBLIC_DOCUMENTS = [
  {
    id: 'ph-1',
    title: 'Corporate Information Security Standard',
    author: 'Morgan Ellis',
    approvedAt: '2026-04-11T14:30:00.000Z',
    approvedLabel: 'Apr 11, 2026',
    status: 'APPROVED',
    content:
      'This standard defines baseline controls for endpoints, identity, and data classification across all business units. Controls are aligned to common assurance frameworks and are reviewed annually or when material systems change.\n\nAll employees and contractors must acknowledge receipt of updates within thirty days of publication. Exceptions require documented risk acceptance by the Chief Information Security Officer.\n\nImplementation guidance, including configuration templates and evidence collection procedures, is maintained in the internal governance portal.',
  },
  {
    id: 'ph-2',
    title: 'Sustainable Procurement Playbook',
    author: 'Priya Nandakumar',
    approvedAt: '2026-03-28T09:15:00.000Z',
    approvedLabel: 'Mar 28, 2026',
    status: 'APPROVED',
    content:
      'The playbook describes how sourcing teams evaluate suppliers on environmental and social criteria alongside cost and quality. It includes scoring rubrics, sample RFP language, and escalation paths for high-risk categories.\n\nCategory managers should use this document alongside the central vendor master data policy. Regional supplements may add local regulatory requirements without lowering global minimums.\n\nQuarterly metrics on supplier engagement and corrective actions are published for leadership review.',
  },
  {
    id: 'ph-3',
    title: 'Workplace Health & Safety Directive',
    author: 'Jordan Lee',
    approvedAt: '2026-04-02T16:00:00.000Z',
    approvedLabel: 'Apr 2, 2026',
    status: 'APPROVED',
    content:
      'This directive establishes minimum expectations for hazard identification, incident reporting, and emergency readiness in all occupied facilities. Site leaders are accountable for local risk registers and closure of corrective actions.\n\nTraining intervals and competency checks are defined by role family. Contractors performing work on company premises must meet equivalent requirements through their employer programs.\n\nSerious incidents must be escalated within one hour through the established command structure.',
  },
  {
    id: 'ph-4',
    title: 'Customer Data Handling Reference',
    author: 'Alex Chen',
    approvedAt: '2026-01-19T11:45:00.000Z',
    approvedLabel: 'Jan 19, 2026',
    status: 'APPROVED',
    content:
      'The reference summarizes lawful bases for processing, retention defaults, and cross-border transfer safeguards used in customer-facing systems. Product and engineering teams should consult privacy counsel before introducing new data elements.\n\nData minimization and purpose limitation principles apply to analytics pipelines and model training datasets. Pseudonymization is expected where direct identifiers are not strictly necessary.\n\nSubject rights workflows are owned by the privacy operations team with defined service levels.',
  },
  {
    id: 'ph-5',
    title: 'Finance Close Calendar & Cutover Rules',
    author: 'Sam Rivera',
    approvedAt: '2026-04-08T07:00:00.000Z',
    approvedLabel: 'Apr 8, 2026',
    status: 'APPROVED',
    content:
      'This publication lists period-end milestones, system freeze windows, and delegation of authority for journal approvals. Controllers must confirm completeness checklists before sign-off on consolidated statements.\n\nIntercompany eliminations and currency translation procedures reference the enterprise chart of accounts and FX policy addendum. Local statutory adjustments are documented separately per entity.\n\nAudit trail requirements for manual postings are unchanged from the prior fiscal year.',
  },
  {
    id: 'ph-6',
    title: 'Brand Voice & Editorial Guidelines',
    author: 'Taylor Brooks',
    approvedAt: '2025-12-05T13:20:00.000Z',
    approvedLabel: 'Dec 5, 2025',
    status: 'APPROVED',
    content:
      'Guidelines describe tone, typography, and accessibility expectations for public communications and product copy. Examples illustrate inclusive language and plain-language thresholds for regulated disclosures.\n\nTemplates for press releases, blog posts, and in-product announcements are versioned in the design system repository. Localization teams adapt examples while preserving mandatory claims.\n\nApprovals follow the marketing operations workflow with staged reviewers based on audience reach.',
  },
  {
    id: 'ph-7',
    title: 'Remote Work & Equipment Policy',
    author: 'Morgan Ellis',
    approvedAt: '2026-02-14T10:30:00.000Z',
    approvedLabel: 'Feb 14, 2026',
    status: 'APPROVED',
    content:
      'The policy clarifies eligibility, ergonomic stipends, and acceptable use of company-issued devices for hybrid arrangements. Managers document team agreements on core collaboration hours and on-site expectations.\n\nCross-border remote arrangements require HR and tax review before commencement. Insurance coverage may differ by jurisdiction and role.\n\nAnnual attestation confirms understanding of security obligations for home networks and physical storage of assets.',
  },
]

const inputFocus =
  'rounded-xl border border-slate-200 bg-white text-slate-900 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100'

function SearchIcon({ className = 'h-5 w-5 text-slate-400' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  )
}

function DocListIcon() {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 ring-1 ring-sky-100/80">
      <svg className="h-6 w-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    </div>
  )
}

export default function PublicHub() {
  const [query, setQuery] = useState('')
  const [sortOrder, setSortOrder] = useState(
    /** @type {'newest' | 'oldest' | 'titleAsc' | 'titleDesc'} */ ('newest'),
  )
  const [activeDoc, setActiveDoc] = useState(/** @type {PublicDoc | null} */ (null))
  const [toast, setToast] = useState(/** @type {string | null} */ (null))

  useEffect(() => {
    if (!toast) return undefined
    const t = window.setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = MOCK_PUBLIC_DOCUMENTS.filter(
      (d) =>
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.author.toLowerCase().includes(q),
    )
    list = [...list].sort((a, b) => {
      if (sortOrder === 'titleAsc') {
        return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      }
      if (sortOrder === 'titleDesc') {
        return b.title.localeCompare(a.title, undefined, { sensitivity: 'base' })
      }
      const ta = new Date(a.approvedAt).getTime()
      const tb = new Date(b.approvedAt).getTime()
      return sortOrder === 'newest' ? tb - ta : ta - tb
    })
    return list
  }, [query, sortOrder])

  function handleDownload(format) {
    const label = format === 'PDF' ? 'PDF' : 'TXT'
    console.log(`Downloading ${label}...`)
    setToast(`Downloading ${label}...`)
  }

  return (
    <motion.div
      className="mx-auto max-w-5xl pb-12"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Public Hub</h1>
          <p className="mt-2 max-w-xl text-base text-slate-600 md:text-lg">
            All official and approved documents in one place.
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#D9EEFC] px-4 py-2 text-sm font-medium text-[#003d7a] ring-1 ring-sky-200/60">
          <span aria-hidden>📄</span>
          <span>
            {filteredSorted.length} Document{filteredSorted.length === 1 ? '' : 's'}
          </span>
        </span>
      </header>

      <div className={`mb-8 flex flex-col gap-4 rounded-2xl border border-slate-100/90 bg-white p-4 md:p-5 ${cardShadow} md:flex-row md:items-center`}>
        <div className="relative w-full md:w-1/2">
          <label htmlFor="public-hub-search" className="sr-only">
            Search by title or author
          </label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            id="public-hub-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or author..."
            className={`w-full py-3 pr-4 pl-11 text-sm ${inputFocus}`}
          />
        </div>
        <div className="flex w-full flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:w-1/2">
          <label
            htmlFor="public-hub-sort"
            className="shrink-0 text-sm font-medium text-slate-600 sm:min-w-[4.5rem]"
          >
            Sort by
          </label>
          <select
            id="public-hub-sort"
            value={sortOrder}
            onChange={(e) =>
              setSortOrder(/** @type {'newest' | 'oldest' | 'titleAsc' | 'titleDesc'} */ (e.target.value))
            }
            className={`w-full max-w-xs cursor-pointer py-3 pr-10 pl-4 text-sm text-slate-800 ${inputFocus}`}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="titleAsc">A-Z (Title)</option>
            <option value="titleDesc">Z-A (Title)</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {filteredSorted.length === 0 ? (
          <div className={`rounded-2xl border border-dashed border-slate-200 bg-white/80 p-10 text-center text-sm text-slate-500 ${cardShadow}`}>
            No documents match your search.
          </div>
        ) : (
          filteredSorted.map((doc) => (
            <div
              key={doc.id}
              className={`group flex flex-col gap-4 rounded-2xl border border-slate-100/90 bg-white p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5 ${cardShadow}`}
            >
              <DocListIcon />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setActiveDoc(doc)}
                  className="text-left text-base font-semibold text-slate-900 underline-offset-2 transition hover:text-[#0056b3] hover:underline"
                >
                  {doc.title}
                </button>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-slate-500">
                    Author: {doc.author} • Approved: {doc.approvedLabel}
                  </p>
                  <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wide text-emerald-800 ring-1 ring-emerald-200/80">
                    APPROVED
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2 md:relative md:h-11 md:w-44">
                <span className="text-sm text-slate-500 md:absolute md:right-0 md:transition-opacity md:duration-200 md:group-hover:pointer-events-none md:group-hover:opacity-0">
                  {doc.approvedLabel}
                </span>
                <div className="flex gap-2 md:absolute md:right-0 md:pointer-events-none md:opacity-0 md:transition-opacity md:duration-200 md:group-hover:pointer-events-auto md:group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload('PDF')
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDownload('TXT')
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-700 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-900"
                  >
                    TXT
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <DocumentDrawer doc={activeDoc} onClose={() => setActiveDoc(null)} onDownload={handleDownload} />

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast}
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-6 left-1/2 z-[60] max-w-[min(90vw,20rem)] -translate-x-1/2 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-medium text-white shadow-lg"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
