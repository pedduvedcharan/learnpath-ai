import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const navLinks = [
    { label: 'Dashboard', to: '/analysis' },
    { label: 'Chat', to: '/questions' },
  ]

  return (
    <nav className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 md:px-10 backdrop-blur-xl bg-[#030712]/80 border-b border-[#1e293b]">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2">
        <span className="font-heading text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 bg-clip-text text-transparent">
          LearnPath AI
        </span>
      </Link>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`text-sm font-medium transition-all duration-300 hover:text-cyan-400 hover:drop-shadow-[0_0_8px_rgba(6,182,212,0.5)] ${
              location.pathname === link.to ? 'text-cyan-400' : 'text-slate-300'
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Mobile hamburger */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-2"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <span
          className={`block w-5 h-0.5 bg-slate-300 transition-all duration-300 ${
            mobileOpen ? 'rotate-45 translate-y-2' : ''
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-slate-300 transition-all duration-300 ${
            mobileOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block w-5 h-0.5 bg-slate-300 transition-all duration-300 ${
            mobileOpen ? '-rotate-45 -translate-y-2' : ''
          }`}
        />
      </button>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 bg-[#030712]/95 backdrop-blur-xl border-b border-[#1e293b] md:hidden">
          <div className="flex flex-col px-6 py-4 gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-medium transition-all duration-300 hover:text-cyan-400 ${
                  location.pathname === link.to ? 'text-cyan-400' : 'text-slate-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
