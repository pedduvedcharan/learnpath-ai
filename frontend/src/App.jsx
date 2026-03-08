import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Welcome from './pages/Welcome'
import Auth from './pages/Auth'
import Details from './pages/Details'
import ResumeUpload from './pages/ResumeUpload'
import DeepQuestions from './pages/DeepQuestions'
import WhatDoYouNeed from './pages/WhatDoYouNeed'
import AnalysisPage from './pages/Analysis'

const pageTransition = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 },
  transition: { duration: 0.4, ease: 'easeInOut' },
}

function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  const showNavbar = location.pathname !== '/' && location.pathname !== '/auth'

  return (
    <div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#0F172A',
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
        }}
      />
      {showNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<AnimatedPage><Welcome /></AnimatedPage>} />
          <Route path="/auth" element={<AnimatedPage><Auth /></AnimatedPage>} />
          <Route path="/details" element={<AnimatedPage><Details /></AnimatedPage>} />
          <Route path="/resume" element={<AnimatedPage><ResumeUpload /></AnimatedPage>} />
          <Route path="/questions" element={<AnimatedPage><DeepQuestions /></AnimatedPage>} />
          <Route path="/need" element={<AnimatedPage><WhatDoYouNeed /></AnimatedPage>} />
          <Route path="/analysis" element={<AnimatedPage><AnalysisPage /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
