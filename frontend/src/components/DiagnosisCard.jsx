import { motion } from 'framer-motion'

export default function DiagnosisCard({ gap, whyBlocking, fixTime, whatYouKnow }) {
  return (
    <motion.div
      initial={{ opacity: 0, rotateX: -15, y: 30 }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      style={{ perspective: 1000 }}
      className="relative bg-slate-900/50 border border-slate-700 rounded-2xl p-8 overflow-hidden"
    >
      {/* Gradient border glow */}
      <div className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(139,92,246,0.15), rgba(245,158,11,0.15))',
        }}
      />
      <div className="absolute -inset-px rounded-2xl pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.3), transparent 40%, rgba(245,158,11,0.3))',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
          padding: '1px',
          borderRadius: '1rem',
        }}
      />

      {/* Three column layout */}
      <div className="relative z-10 flex flex-col md:flex-row gap-8">
        {/* LEFT: What You Know */}
        <div className="flex-1 min-w-0">
          <h3 className="text-green-400 font-heading font-bold text-lg mb-4">What You Know</h3>
          <ul className="space-y-2">
            {(whatYouKnow || []).map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
                className="flex items-start gap-2 text-slate-300 text-sm"
              >
                <span className="text-green-400 mt-0.5 flex-shrink-0">&#10003;</span>
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* CENTER: The Gap */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center">
          <motion.h3
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-2xl font-heading font-bold text-white mb-3"
          >
            &#9889; THE GAP
          </motion.h3>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="relative"
          >
            <p className="text-amber-400 text-xl font-semibold leading-relaxed">
              {gap}
            </p>
            {/* Glow behind text */}
            <div className="absolute inset-0 blur-2xl opacity-20 bg-amber-400 pointer-events-none rounded-full" />
          </motion.div>
        </div>

        {/* RIGHT: Fix Timeline */}
        <div className="flex-1 min-w-0 flex flex-col items-center md:items-end justify-center">
          <h3 className="text-cyan-400 font-heading font-bold text-lg mb-3">Fix Timeline</h3>
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className="text-4xl font-bold text-white font-heading"
          >
            {fixTime}
          </motion.span>
        </div>
      </div>

      {/* Bottom: Why blocking */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="relative z-10 mt-8 pt-6 border-t border-slate-700/50"
      >
        <span className="text-sm font-semibold text-slate-400 block mb-2">
          Why this is blocking you:
        </span>
        <p className="text-slate-300 leading-relaxed">{whyBlocking}</p>
      </motion.div>
    </motion.div>
  )
}
