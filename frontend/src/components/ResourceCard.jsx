import { motion } from 'framer-motion'

const platformConfig = {
  YouTube: {
    color: 'bg-red-500',
    icon: '\u25B6\uFE0F',
  },
  Coursera: {
    color: 'bg-blue-500',
    icon: '\uD83C\uDF93',
  },
  GitHub: {
    color: 'bg-slate-600',
    icon: '\uD83D\uDC19',
  },
  'LinkedIn Learning': {
    color: 'bg-blue-600',
    icon: '\uD83D\uDCBC',
  },
  Medium: {
    color: 'bg-green-500',
    icon: '\u270D\uFE0F',
  },
}

export default function ResourceCard({ resource }) {
  const { platform, title, url, specific_section, why_it_fits } = resource
  const config = platformConfig[platform] || { color: 'bg-slate-600', icon: '\uD83D\uDCDA' }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-slate-900/50 border border-slate-700 rounded-xl p-5 min-w-[300px] max-w-[350px] flex-shrink-0 flex flex-col gap-3 hover:shadow-lg hover:shadow-cyan-500/10 transition-shadow"
    >
      {/* Platform badge */}
      <span
        className={`${config.color} text-white text-xs font-semibold px-3 py-1 rounded-full w-fit flex items-center gap-1.5`}
      >
        <span>{config.icon}</span>
        {platform}
      </span>

      {/* Title */}
      <h4 className="text-lg font-semibold text-white line-clamp-2 leading-snug">
        {title}
      </h4>

      {/* YouTube-specific section badge */}
      {platform === 'YouTube' && specific_section && (
        <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full w-fit">
          \uD83D\uDD50 {specific_section}
        </span>
      )}

      {/* Non-YouTube specific section */}
      {platform !== 'YouTube' && specific_section && (
        <span className="text-xs text-slate-400">
          \uD83D\uDCCC {specific_section}
        </span>
      )}

      {/* Why it fits */}
      {why_it_fits && (
        <p className="text-sm text-slate-400 italic leading-relaxed">
          Why: {why_it_fits}
        </p>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400 rounded-lg px-4 py-2 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 w-fit"
      >
        Open Resource
        <span className="text-sm">&rarr;</span>
      </a>
    </motion.div>
  )
}
