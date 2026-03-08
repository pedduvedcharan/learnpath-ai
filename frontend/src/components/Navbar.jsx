import { useState } from 'react'
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''

  const navLinks = [
    { label: 'Dashboard', to: `/analysis${uid ? `?uid=${uid}` : ''}` },
  ]

  return (
    <nav className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 md:px-10 backdrop-blur-xl bg-white/80 border-b border-slate-200">
      <Link to="/" className="flex items-center gap-2">
        <span className="font-heading text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
          LearnPath AI
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        {navLinks.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className={`text-sm font-medium transition-all duration-300 hover:text-indigo-600 ${
              location.pathname === link.to.split('?')[0] ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            {link.label}
          </Link>
        ))}
        <button
          onClick={() => navigate('/auth')}
          className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors"
        >
          Logout
        </button>
      </div>

      <button
        className="md:hidden flex flex-col gap-1.5 p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <span className={`block w-5 h-0.5 bg-slate-600 transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-5 h-0.5 bg-slate-600 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-5 h-0.5 bg-slate-600 transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 md:hidden">
          <div className="flex flex-col px-6 py-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-medium transition-all duration-300 hover:text-indigo-600 ${
                  location.pathname === link.to.split('?')[0] ? 'text-indigo-600' : 'text-slate-500'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => { setMobileOpen(false); navigate('/auth') }}
              className="text-sm font-medium text-slate-400 hover:text-red-500 transition-colors text-left"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
