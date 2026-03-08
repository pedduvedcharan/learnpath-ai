import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const creatingTexts = [
  'Setting up your account...',
  'Preparing your learning space...',
  'Almost ready...',
]

export default function Auth() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(searchParams.get('tab') || 'signup')
  const [creating, setCreating] = useState(false)
  const [creatingIdx, setCreatingIdx] = useState(0)

  // Signup fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  // Login fields
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPhone, setLoginPhone] = useState('')

  const fieldClass =
    'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all'

  const isSignupValid = firstName.trim() && lastName.trim() && email.trim() && phone.trim()
  const isLoginValid = loginEmail.trim() && loginPhone.trim()

  const handleSignup = async () => {
    if (!isSignupValid) return

    setCreating(true)
    setCreatingIdx(0)

    // Cycle creating texts
    const interval = setInterval(() => {
      setCreatingIdx((prev) => (prev + 1) % creatingTexts.length)
    }, 1500)

    try {
      const res = await axios.post(`${API_BASE}/api/auth/signup`, {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      })

      clearInterval(interval)
      const uid = res.data.user_id
      toast.success(`Welcome, ${res.data.name}!`)

      // Small delay to show the success before navigating
      setTimeout(() => {
        navigate(`/details?uid=${uid}`)
      }, 800)
    } catch (err) {
      clearInterval(interval)
      setCreating(false)
      const msg = err.response?.data?.detail || 'Signup failed. Please try again.'
      toast.error(msg)
    }
  }

  const handleLogin = async () => {
    if (!isLoginValid) return

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, {
        email: loginEmail,
        phone: loginPhone,
      })

      const uid = res.data.user_id
      const name = res.data.name
      toast.success(`Welcome back, ${name}!`)

      // If they have a completed session, go straight to dashboard
      if (res.data.has_session) {
        navigate(`/analysis?uid=${uid}`)
      } else {
        // Otherwise continue where they left off
        const c = res.data.completion || {}
        if (c.has_need) {
          navigate(`/analysis?uid=${uid}`)
        } else if (c.has_profile) {
          navigate(`/need?uid=${uid}`)
        } else if (c.has_questions) {
          navigate(`/questions?uid=${uid}`)
        } else {
          navigate(`/details?uid=${uid}`)
        }
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Login failed. Please try again.'
      toast.error(msg)
    }
  }

  // Creating account animation screen
  if (creating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 animate-gradient-mesh opacity-30 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(139,92,246,0.08) 0%, transparent 50%)',
          }}
        />

        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 mb-8"
          style={{ boxShadow: '0 0 60px rgba(79,70,229,0.3)' }}
        />

        <AnimatePresence mode="wait">
          <motion.p
            key={creatingIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-lg text-slate-600 font-medium"
          >
            {creatingTexts[creatingIdx]}
          </motion.p>
        </AnimatePresence>

        <div className="w-48 bg-slate-200 h-1.5 rounded-full mt-6 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
            initial={{ width: '0%' }}
            animate={{ width: '90%' }}
            transition={{ duration: 4, ease: 'easeOut' }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 animate-gradient-mesh pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(139,92,246,0.06) 0%, transparent 50%)',
          backgroundSize: '400% 400%',
        }}
      />

      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <motion.div variants={fadeUp} className="text-center mb-8">
          <h1 className="font-heading text-4xl font-extrabold bg-gradient-to-r from-indigo-700 via-violet-600 to-indigo-700 bg-clip-text text-transparent">
            LearnPath AI
          </h1>
          <p className="text-slate-500 mt-1">Your Personal AI Learning Coach</p>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp} className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 overflow-hidden">
          {/* Tab switcher */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                tab === 'signup'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-all ${
                tab === 'login'
                  ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              Log In
            </button>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {tab === 'signup' ? (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-500 font-medium">First Name</label>
                      <input
                        type="text"
                        placeholder="John"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={fieldClass}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-500 font-medium">Last Name</label>
                      <input
                        type="text"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={fieldClass}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-medium">Email</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-medium">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <button
                    onClick={handleSignup}
                    disabled={!isSignupValid}
                    className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 mt-2 ${
                      isSignupValid
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Create Account
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-medium">Email</label>
                    <input
                      type="email"
                      placeholder="john@example.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-500 font-medium">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={loginPhone}
                      onChange={(e) => setLoginPhone(e.target.value)}
                      className={fieldClass}
                    />
                  </div>

                  <button
                    onClick={handleLogin}
                    disabled={!isLoginValid}
                    className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 mt-2 ${
                      isLoginValid
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Log In
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p variants={fadeUp} className="text-center text-xs text-slate-400 mt-6">
          HackAI 2026 — UT Dallas
        </motion.p>
      </motion.div>
    </div>
  )
}
