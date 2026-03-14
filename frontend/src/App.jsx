import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket } from 'lucide-react';

import Navbar from './components/Navbar';
import Terminal from './components/Terminal';
import Features from './components/Features';
import AboutSection from './components/AboutSection';
import { InteractionDemo } from './components/InteractionDemo';
import SkillsSection from './components/SkillSection';
import SetupPage from '../pages/SetupPage';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
};

function HomePage() {
  return (
    <div className="min-h-screen selection:bg-black selection:text-white">
      {/* Structural Background Grid */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M60 60H0V0h60v60zM1 1h58v58H1V1z' fill='%23000' fill-rule='evenodd'/%3E%3C/svg%3E")` }}>
      </div>

      <Navbar />

      {/* 1. HERO */}
      <motion.header initial="initial" animate="animate" className="relative z-10 pt-48 pb-32 text-center px-6">
        <motion.h1 variants={fadeInUp} className="text-7xl md:text-[10rem] font-black tracking-[-0.05em] mb-6 text-black italic leading-none">
          Nudge
        </motion.h1>
        <motion.p variants={fadeInUp} className="text-lg md:text-2xl text-gray-500 font-medium max-w-lg mx-auto">
          Your system, one nudge away.
        </motion.p>
        <motion.div
          variants={fadeInUp}
          className="mt-32 w-full max-w-4xl mx-auto px-4 drop-shadow-[0_30px_60px_rgba(0,0,0,0.08)]"
        >
          <Terminal /> {/* Terminal logic inside remains the same, container expanded */}
        </motion.div>
      </motion.header>

      {/* 2. ABOUT & INTERACTION */}
      <AboutSection screenshotUrl="/capabilities-list.png" />
      <InteractionDemo phoneImg="/telegram-ui.png" laptopImg="/cli-output.png" />

      {/* 3. ARCHITECTURE */}
      <SkillsSection />

      {/* 4. CAPABILITIES GRID */}
      <section className="relative z-10 py-32 bg-gray-300 border-y border-gray-400">
        <div className="max-w-6xl mx-auto px-6 ">
          <div className="mb-16">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4">Features</h2>
            <h3 className="text-3xl font-bold tracking-tight text-gray-900">Built for speed and reach.</h3>
          </div>
          <Features />
        </div>
      </section>

      {/* 5. FINAL CTA */}
      <section className="relative z-10 py-40 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 shadow-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs md:text-sm font-semibold text-gray-600 tracking-tight">Available for macOS and Windows</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to automate?</h2>
          <p className="text-gray-500 mb-10 text-lg max-w-xl mx-auto leading-relaxed">Join developers using Nudge to bridge the gap between mobile and local.</p>

          <Link to="/setup" className="group relative inline-flex items-center justify-center px-10 py-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all hover:scale-[1.02] shadow-xl">
            <span>View Setup Guide</span>
            <Rocket size={18} className="ml-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </Link>
        </motion.div>
      </section>

      <footer className="py-16 text-center border-t border-gray-100 bg-white relative z-10">
        <div className="text-xl font-bold italic tracking-tighter mb-2">Nudge</div>
        <p className="text-[10px] text-gray-400 uppercase tracking-[0.3em] font-bold">Built for the terminal • 2026</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/setup" element={<SetupPage />} />
    </Routes>
  );
}