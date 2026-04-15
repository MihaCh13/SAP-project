/** Bento-style white card on app canvas. */
export default function SimplePage({ title, description }) {
  return (
    <div className="rounded-2xl border border-slate-100/90 bg-white p-6 shadow-[0_4px_28px_-6px_rgba(15,23,42,0.1)] md:p-8">
      <h1 className="text-xl font-semibold tracking-tight text-slate-900 md:text-2xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      ) : null}
    </div>
  )
}
