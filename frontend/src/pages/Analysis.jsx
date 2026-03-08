import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import DiagnosisCard from '../components/DiagnosisCard'
import RoadmapGraph from '../components/RoadmapGraph'
import ResourceCard from '../components/ResourceCard'
import PracticeChallenge from '../components/PracticeChallenge'
import MissionBar from '../components/MissionBar'
import ChatInterface from '../components/ChatInterface'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const mockResults = {
  gap: 'Understanding neural network backpropagation and gradient descent optimization',
  why_blocking:
    "Without understanding how gradients flow backward through the network, you can't debug training issues, tune hyperparameters effectively, or understand why your models aren't converging.",
  fix_time: '2-3 weeks',
  what_you_know: [
    'Python programming',
    'Basic linear algebra',
    'Data preprocessing with Pandas',
    'Scikit-learn basics',
  ],
  roadmap: [
    { node: 'Python & NumPy Foundations', status: 'complete', description: 'Core Python and numerical computing' },
    { node: 'Linear Algebra for ML', status: 'complete', description: 'Vectors, matrices, transformations' },
    { node: 'Neural Network Basics', status: 'current', description: 'Perceptrons, activation functions, forward pass' },
    { node: 'Backpropagation Deep Dive', status: 'locked', description: 'Chain rule, gradient computation, optimization' },
    { node: 'Build & Train Models', status: 'locked', description: 'PyTorch/TensorFlow hands-on projects' },
  ],
  key_concepts: ['Chain Rule & Computational Graphs', 'Gradient Descent Variants', 'Loss Function Selection'],
  challenge:
    'Build a neural network from scratch using only NumPy that classifies handwritten digits (MNIST). Implement forward pass, backpropagation, and gradient descent manually without using any ML framework. This will cement your understanding of how gradients flow.',
  challenge_time: '45 mins',
  voice_narration:
    "Hey there! I'm Coach Sarah, and I've analyzed your profile. You've got solid Python skills and good math foundations — that's a great starting point. The key gap I see is in understanding backpropagation. Let's fix that together.",
  resources: [
    {
      platform: 'YouTube',
      title: '3Blue1Brown - Neural Networks',
      url: 'https://www.youtube.com/watch?v=aircAruvnKk&t=272',
      specific_section: 'Start at 4:32 — Backpropagation visualization',
      why_it_fits: 'Visual learner? This is the best visual explanation of backprop on the internet.',
    },
    {
      platform: 'Coursera',
      title: 'Andrew Ng - Deep Learning Specialization',
      url: 'https://www.coursera.org/specializations/deep-learning',
      specific_section: 'Course 1, Week 3 — Shallow Neural Networks',
      why_it_fits: 'Matches your intermediate level and structured learning preference.',
    },
    {
      platform: 'GitHub',
      title: 'Neural Networks from Scratch',
      url: 'https://github.com/SkalskiP/ILearnDeepLearning.py',
      specific_section: '01_mysteries_of_neural_networks/',
      why_it_fits: 'Hands-on notebooks that build on your Python skills.',
    },
    {
      platform: 'Medium',
      title: 'Backpropagation Made Ridiculously Simple',
      url: 'https://medium.com/@14prakash/back-propagation-is-very-simple-who-made-it-complicated-97b794c97e5c',
      specific_section: 'The Chain Rule section',
      why_it_fits: 'Quick read that connects theory to the math you already know.',
    },
    {
      platform: 'LinkedIn Learning',
      title: 'Deep Learning Foundations',
      url: 'https://www.linkedin.com/learning/deep-learning-foundations',
      specific_section: 'Chapter 5 — Training Neural Networks',
      why_it_fits: 'Professional-quality content matching your career goal timeline.',
    },
  ],
  audio_url: null,
}

const loadingTexts = [
  'Analyzing your profile...',
  'Diagnosing knowledge gaps...',
  'Building your roadmap...',
  'Finding perfect resources...',
  'Generating your challenge...',
  'Preparing voice coach...',
]

function LoadingScreen() {
  const [textIndex, setTextIndex] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 0.8, 90))
    }, 100)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background gradient mesh */}
      <div
        className="absolute inset-0 animate-gradient-mesh opacity-30"
        style={{
          background:
            'radial-gradient(ellipse at 20% 50%, rgba(79,70,229,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(139,92,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at 50% 80%, rgba(245,158,11,0.04) 0%, transparent 50%)',
        }}
      />

      {/* Animated orb */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 mb-10 relative"
        style={{
          filter: 'blur(1px)',
          boxShadow: '0 0 60px rgba(79,70,229,0.3), 0 0 120px rgba(139,92,246,0.15)',
        }}
      >
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 blur-sm" />
      </motion.div>

      {/* Cycling text */}
      <div className="h-8 relative z-10">
        <AnimatePresence mode="wait">
          <motion.p
            key={textIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-lg text-slate-600 font-medium text-center"
          >
            {loadingTexts[textIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-64 bg-slate-200 h-1.5 rounded-full mt-8 overflow-hidden relative z-10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

function VoiceCoachPanel({ audioUrl, voiceNarration }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [displayedText, setDisplayedText] = useState('')
  const [autoPlayFailed, setAutoPlayFailed] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const audioRef = useRef(null)
  const audioUrlRef = useRef(audioUrl)
  const typewriterRef = useRef(null)

  // Store audioUrl in ref for replay
  useEffect(() => {
    audioUrlRef.current = audioUrl
  }, [audioUrl])

  // Auto-play audio on mount
  useEffect(() => {
    if (dismissed || !audioUrl) return

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.oncanplaythrough = () => setAudioReady(true)
    audio.onplay = () => { setIsPlaying(true); setAutoPlayFailed(false) }
    audio.onpause = () => setIsPlaying(false)
    audio.onended = () => setIsPlaying(false)
    audio.onerror = (e) => {
      console.error('Audio load error:', e)
      setAudioError(true)
      setAutoPlayFailed(true)
    }

    audio.play().catch((err) => {
      console.log('Autoplay blocked:', err.message)
      setAutoPlayFailed(true)
    })

    return () => { audio.pause(); audio.src = '' }
  }, [audioUrl, dismissed])

  // Typewriter effect for narration text
  useEffect(() => {
    if (!voiceNarration || dismissed) return
    setDisplayedText('')
    let i = 0
    const text = voiceNarration
    typewriterRef.current = setInterval(() => {
      i++
      setDisplayedText(text.slice(0, i))
      if (i >= text.length) clearInterval(typewriterRef.current)
    }, 30)
    return () => clearInterval(typewriterRef.current)
  }, [voiceNarration, dismissed])

  const togglePlay = () => {
    if (!audioRef.current) {
      // Recreate audio if it was destroyed
      if (audioUrlRef.current) {
        const audio = new Audio(audioUrlRef.current)
        audioRef.current = audio
        audio.onplay = () => setIsPlaying(true)
        audio.onpause = () => setIsPlaying(false)
        audio.onended = () => setIsPlaying(false)
        audio.play().catch(() => {})
      }
      return
    }
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play().catch(() => {})
    }
  }

  const handleStop = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    audioRef.current = null
    clearInterval(typewriterRef.current)
    setDismissed(true)
  }

  if (dismissed) return null

  // Show panel even without audio — narration text is still valuable
  if (!audioUrl && !voiceNarration) return null

  const bars = [0.4, 0.7, 1, 0.6, 0.8, 0.5, 0.9]

  return (
    <motion.div
      initial={{ x: 340, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 340, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      className="fixed top-20 right-4 z-50 w-[320px] bg-white border border-slate-200 rounded-2xl shadow-xl shadow-indigo-500/10 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600">
        <div className="relative">
          <div className={`w-9 h-9 rounded-full bg-white/20 flex items-center justify-center ${isPlaying ? '' : ''}`}>
            <div className={`w-5 h-5 rounded-full bg-white ${isPlaying ? 'animate-pulse' : ''}`} />
          </div>
          {isPlaying && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-indigo-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Coach Sarah</p>
          <p className="text-xs text-white/70">{isPlaying ? 'Speaking...' : audioError ? 'Audio unavailable' : autoPlayFailed ? 'Tap play to listen' : audioUrl ? 'Your AI Coach' : 'Your AI Coach'}</p>
        </div>
        <button
          onClick={handleStop}
          className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
          title="Close"
        >
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Waveform */}
      {(isPlaying || autoPlayFailed) && (
        <div className="flex items-center justify-center gap-[3px] h-8 px-4 bg-indigo-50/50">
          {bars.map((height, i) => (
            <div
              key={i}
              className="w-[3px] bg-indigo-500 rounded-full transition-all duration-150"
              style={{
                height: isPlaying ? `${height * 20}px` : '3px',
                animation: isPlaying ? `waveform 0.7s ease-in-out ${i * 0.08}s infinite alternate` : 'none',
              }}
            />
          ))}
        </div>
      )}

      {/* Narration text — typewriter */}
      {voiceNarration && (
        <div className="px-4 py-3 max-h-[200px] overflow-y-auto">
          <p className="text-sm text-slate-600 leading-relaxed">
            {displayedText}
            {displayedText.length < voiceNarration.length && (
              <span className="inline-block w-0.5 h-4 bg-indigo-500 ml-0.5 animate-pulse align-middle" />
            )}
          </p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-slate-100">
        {audioUrl && !audioError && (
          <button
            onClick={togglePlay}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              isPlaying
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {isPlaying ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6" />
                </svg>
                Pause
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                {autoPlayFailed ? 'Play' : 'Replay'}
              </span>
            )}
          </button>
        )}
        <button
          onClick={handleStop}
          className={`py-2 px-4 rounded-lg text-sm font-medium transition-all ${audioUrl && !audioError ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'flex-1 bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {audioUrl && !audioError ? 'Stop' : 'Dismiss'}
        </button>
      </div>

      <style>{`
        @keyframes waveform {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </motion.div>
  )
}

function RevealSection({ visible, delay, children }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function Analysis() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [visibleSections, setVisibleSections] = useState(0)
  const [chatOpen, setChatOpen] = useState(false)
  const resourcesRef = useRef(null)
  const [searchParams] = useSearchParams()
  const userId = searchParams.get('uid') || ''

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.post(`${API_BASE}/api/generate`, {
          user_id: userId,
        })

        const result = response.data
        const diagnosis = result.diagnosis || {}
        setData({
          ...diagnosis,
          resources: result.resources || diagnosis.resources || [],
          youtube_results: result.youtube_results || [],
          audio_url: result.audio_url || null,
          session_id: result.session_id,
        })
      } catch (err) {
        console.error('Generate API failed:', err)
        setData(mockResults)
      } finally {
        setTimeout(() => setLoading(false), 2000)
      }
    }

    if (userId) {
      fetchData()
    } else {
      setData(mockResults)
      setTimeout(() => setLoading(false), 1000)
    }
  }, [userId])

  useEffect(() => {
    if (!loading && data) {
      const totalSections = 6
      let current = 0
      const reveal = () => {
        current++
        setVisibleSections(current)
        if (current < totalSections) {
          setTimeout(reveal, 500)
        }
      }
      setTimeout(reveal, 300)
    }
  }, [loading, data])

  const handleNodeClick = useCallback((index) => {
    resourcesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!data) return null

  return (
    <div className="min-h-screen pb-24">
      {/* Voice Coach Sidebar Panel */}
      <AnimatePresence>
        {visibleSections >= 1 && (
          <VoiceCoachPanel audioUrl={data.audio_url} voiceNarration={data.voice_narration} />
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 space-y-10">
        {/* Section A: Diagnosis */}
        <RevealSection visible={visibleSections >= 1} delay={0}>
          <div>
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-heading text-2xl font-bold text-slate-900 mb-6"
            >
              Your Diagnosis
            </motion.h2>
            <DiagnosisCard
              gap={data.gap}
              whyBlocking={data.why_blocking}
              fixTime={data.fix_time}
              whatYouKnow={data.what_you_know}
            />
          </div>
        </RevealSection>

        {/* Section B: Roadmap */}
        <RevealSection visible={visibleSections >= 2} delay={0}>
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">
              Your Learning Roadmap
            </h2>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 overflow-hidden shadow-sm">
              <RoadmapGraph roadmap={data.roadmap} onNodeClick={handleNodeClick} />
            </div>
            {data.key_concepts && data.key_concepts.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="text-sm text-slate-500">Key concepts:</span>
                {data.key_concepts.map((concept, i) => (
                  <span
                    key={i}
                    className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-200 px-3 py-1 rounded-full"
                  >
                    {concept}
                  </span>
                ))}
              </div>
            )}
          </div>
        </RevealSection>

        {/* Section C: Resources */}
        <RevealSection visible={visibleSections >= 3} delay={0}>
          <div ref={resourcesRef}>
            <h2 className="font-heading text-2xl font-bold text-slate-900 mb-6">
              Handpicked Resources — Just For You
            </h2>
            <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin">
              {(data.resources || []).map((resource, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                >
                  <ResourceCard resource={resource} />
                </motion.div>
              ))}
            </div>
          </div>
        </RevealSection>

        {/* Section D: Practice Challenge */}
        <RevealSection visible={visibleSections >= 4} delay={0}>
          <PracticeChallenge challenge={data.challenge} challengeTime={data.challenge_time} />
        </RevealSection>

        {/* Section E: Mission Bar */}
        <RevealSection visible={visibleSections >= 5} delay={0}>
          <MissionBar xp={100} streak={1} />
        </RevealSection>
      </div>

      {/* Chat toggle button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 3, type: 'spring', stiffness: 200 }}
        onClick={() => setChatOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25 flex items-center justify-center text-2xl z-40 hover:shadow-indigo-500/40 transition-shadow"
        style={{
          animation: chatOpen ? 'none' : 'chatPulse 2s ease-in-out infinite',
        }}
      >
        {chatOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <span>&#128172;</span>
        )}
      </motion.button>

      {/* Chat Interface */}
      <ChatInterface userId={userId} isOpen={chatOpen} onClose={() => setChatOpen(false)} />

      <style>{`
        @keyframes chatPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(79,70,229,0.4); }
          50% { box-shadow: 0 0 0 12px rgba(79,70,229,0); }
        }

        .scrollbar-thin::-webkit-scrollbar {
          height: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #CBD5E1;
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}
