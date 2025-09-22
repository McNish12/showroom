const TopBar = () => {
  return (
    <div className="bg-black/95 text-white text-xs sm:text-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-4 px-4 py-1">
        <a
          className="opacity-80 transition hover:opacity-100"
          href="mailto:info@rocketcatalog.com"
        >
          info@rocketcatalog.com
        </a>
        <span className="hidden text-white/60 sm:inline">•</span>
        <a
          className="opacity-80 transition hover:opacity-100"
          href="tel:+13125550110"
        >
          (312) 555-0110
        </a>
      </div>
    </div>
  )
}

export default TopBar
