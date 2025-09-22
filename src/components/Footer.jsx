import rocketLogo from '../assets/rocket-logo.svg'

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white/80 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-center text-sm text-slate-500 sm:flex-row sm:text-left">
        <div className="flex items-center gap-3">
          <img src={rocketLogo} alt="Rocket Catalog" className="h-12 w-auto" loading="lazy" />
          <div>
            <p className="font-heading text-base font-semibold text-ink">Rocket Catalog</p>
            <p>2140 Launchpad Drive • Chicago, IL 60601</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 sm:items-end">
          <a className="hover:text-brand" href="mailto:info@rocketcatalog.com">
            info@rocketcatalog.com
          </a>
          <a className="hover:text-brand" href="tel:+13125550110">
            (312) 555-0110
          </a>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Rocket Catalog. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
