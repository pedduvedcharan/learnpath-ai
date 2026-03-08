import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: 4 + Math.random() * 2,
  duration: 10 + Math.random() * 15,
  delay: Math.random() * 15,
  color: i % 2 === 0 ? 'bg-cyan-400' : 'bg-violet-400',
}))

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const features = [
  { emoji: '\uD83C\uDFAF', label: 'Gap Diagnosis' },
  { emoji: '\uD83D\uDDFA\uFE0F', label: 'Visual Roadmap' },
  { emoji: '\uD83C\uDF99\uFE0F', label: 'Voice Coach' },
]

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Animated gradient mesh background */}
      <div
        className="absolute inset-0 animate-gradient-mesh pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(6,182,212,0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(6,182,212,0.1) 0%, transparent 50%)',
          backgroundSize: '400% 400%',
        }}
      />

      {/* Floating particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className={`absolute rounded-full ${p.color} opacity-20 pointer-events-none`}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `particleFloat ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}

      {/* Center content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6 px-4 text-center"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Badge */}
        <motion.div variants={fadeUp}>
          <span className="inline-block border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-sm rounded-full px-4 py-1">
            &#10022; HackAI 2026 — UT Dallas
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={fadeUp}
          className="font-heading text-5xl md:text-7xl font-extrabold text-white tracking-tight"
        >
          LearnPath AI
        </motion.h1>

        {/* Subtitle */}
        <motion.p variants={fadeUp} className="text-xl text-cyan-400 font-medium">
          Your Personal AI Learning Coach
        </motion.p>

        {/* Description */}
        <motion.p
          variants={fadeUp}
          className="text-slate-400 max-w-2xl text-center leading-relaxed"
        >
          Upload your resume, answer a few targeted questions, and let our AI engine
          diagnose your skill gaps, generate a personalized learning roadmap, and
          coach you with an interactive voice assistant — all in minutes.
        </motion.p>

        {/* Feature pills */}
        <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-3">
          {features.map((f) => (
            <span
              key={f.label}
              className="bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-slate-300"
            >
              {f.emoji} {f.label}
            </span>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.button
          variants={fadeUp}
          onClick={() => navigate('/details')}
          className="mt-4 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-semibold text-lg shadow-lg shadow-cyan-500/25 hover:scale-[1.03] hover:shadow-cyan-500/40 active:scale-[0.97] transition-all duration-200 cursor-pointer"
        >
          Begin Your Journey &rarr;
        </motion.button>
      </motion.div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 z-10 animate-bounce-chevron">
        <svg
          className="w-6 h-6 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
