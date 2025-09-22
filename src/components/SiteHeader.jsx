import PropTypes from 'prop-types'
import rocketLogo from '../assets/rocket-logo.svg'

const SiteHeader = ({
  categories,
  activeCategory,
  onCategoryChange,
  searchTerm,
  onSearchChange,
  imprintOptions,
  activeImprint,
  onImprintChange,
  tagOptions,
  activeTag,
  onTagChange,
}) => {
  const handleCategoryClick = (category) => {
    if (onCategoryChange) {
      onCategoryChange(category === activeCategory ? '' : category)
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-4">
        <div className="flex flex-wrap items-center gap-6">
          <a className="flex items-center gap-3" href="#top" aria-label="Rocket Catalog home">
            <img src={rocketLogo} alt="Rocket Catalog" className="h-10 w-auto" loading="lazy" />
            <span className="hidden text-lg font-heading font-semibold text-ink sm:inline">
              Rocket Catalog
            </span>
          </a>
          <nav className="flex flex-1 flex-wrap items-center gap-2 overflow-x-auto text-xs font-heading uppercase tracking-wider text-slate-500">
            <button
              type="button"
              onClick={() => handleCategoryClick('')}
              className={`rounded-full px-3 py-1 transition ${
                activeCategory === ''
                  ? 'bg-brand text-white shadow'
                  : 'hover:text-brand'
              }`}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleCategoryClick(category)}
                className={`rounded-full px-3 py-1 transition ${
                  activeCategory === category
                    ? 'bg-brand text-white shadow'
                    : 'hover:text-brand'
                }`}
              >
                {category}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="mb-1 text-[0.65rem]">Search</span>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="Search products, tags, vendor…"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="mb-1 text-[0.65rem]">Category</span>
            <select
              value={activeCategory}
              onChange={(event) => onCategoryChange?.(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="mb-1 text-[0.65rem]">Imprint Method</span>
            <select
              value={activeImprint}
              onChange={(event) => onImprintChange?.(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All Imprint Methods</option>
              {imprintOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span className="mb-1 text-[0.65rem]">Tags</span>
            <select
              value={activeTag}
              onChange={(event) => onTagChange?.(event.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-charcoal shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">All Tags</option>
              {tagOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  )
}

SiteHeader.propTypes = {
  categories: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeCategory: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func,
  searchTerm: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  imprintOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeImprint: PropTypes.string.isRequired,
  onImprintChange: PropTypes.func,
  tagOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeTag: PropTypes.string.isRequired,
  onTagChange: PropTypes.func,
}

export default SiteHeader
