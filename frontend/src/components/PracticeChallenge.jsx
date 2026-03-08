import { motion } from 'framer-motion'

export default function PracticeChallenge({ challenge, challengeTime }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 120, damping: 14 }}
      className="relative bg-slate-900/50 border border-amber-500/30 rounded-2xl p-6 overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

      {/* Timer badge (top-right) */}
      {challengeTime && (
        <span className="absolute top-4 right-4 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-medium">
          &#9201; Est. {challengeTime}
        </span>
      )}

      {/* Title */}
      <h3 className="font-heading text-xl text-amber-400 font-bold mb-4">
        &#127942; Your Custom Challenge
      </h3>

      {/* Challenge description */}
      <p className="text-slate-200 leading-relaxed mb-6 pr-20">
        {challenge}
      </p>

      {/* Start button */}
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg px-6 py-2.5 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25"
      >
        Start Challenge
        <span>&rarr;</span>
      </motion.button>
    </motion.div>
  )
}
