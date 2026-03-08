import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Welcome from './pages/Welcome'
import Details from './pages/Details'
import ResumeUpload from './pages/ResumeUpload'
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

// Placeholder pages for routes not yet built
function DeepQuestions() {
  return (
    <AnimatedPage>
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="font-heading text-4xl text-white">Deep Questions — Coming Soon</h1>
      </div>
    </AnimatedPage>
  )
}

function WhatDoYouNeed() {
  return (
    <AnimatedPage>
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="font-heading text-4xl text-white">What Do You Need — Coming Soon</h1>
      </div>
    </AnimatedPage>
  )
}

function Analysis() {
  return (
    <AnimatedPage>
      <AnalysisPage />
    </AnimatedPage>
  )
}

export default function App() {
  const location = useLocation()
  const showNavbar = location.pathname !== '/'

  return (
    <div className="noise-overlay">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
          },
        }}
      />
      {showNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <AnimatedPage>
                <Welcome />
              </AnimatedPage>
            }
          />
          <Route
            path="/details"
            element={
              <AnimatedPage>
                <Details />
              </AnimatedPage>
            }
          />
          <Route
            path="/resume"
            element={
              <AnimatedPage>
                <ResumeUpload />
              </AnimatedPage>
            }
          />
          <Route
            path="/questions"
            element={<DeepQuestions />}
          />
          <Route
            path="/need"
            element={<WhatDoYouNeed />}
          />
          <Route
            path="/analysis"
            element={<Analysis />}
          />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
