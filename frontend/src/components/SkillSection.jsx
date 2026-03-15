import React from 'react';
import { Brain, Wrench, Play } from 'lucide-react';

export default function SkillsSection() {
  const workflow = [
    { step: "01", title: "Skills Definition", desc: "JSON schemas defining tool capabilities for the LLM.", icon: <Brain className="text-purple-400" /> },
    { step: "02", title: "Intent Matching", desc: "The agent analyzes requests and selects the precise skillset.", icon: <Play className="text-blue-400" /> },
    { step: "03", title: "Tool Execution", desc: "Native JS execution on the laptop device to perform actions.", icon: <Wrench className="text-emerald-400" /> }
  ];

  return (
    <>
      <style>{`
        @keyframes beam-travel {
          0%   { stroke-dashoffset: 400; }
          100% { stroke-dashoffset: 0; }
        }
        .beam-path {
          stroke-dasharray: 90 310;
          stroke-dashoffset: 400;
          animation: beam-travel 1.8s linear infinite;
        }
        /* Glow pulse on the card border itself */
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
          50%       { box-shadow: 0 0 18px 2px rgba(16,185,129,0.18); }
        }
        .card-glow:hover {
          animation: glow-pulse 2s ease-in-out infinite;
        }
      `}</style>

      <section className="py-32 px-6 border-y border-gray-400 bg-gray-300 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-16">

            <div className="lg:col-span-1 text-left">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4">Architecture</h2>
              <h3 className="text-4xl font-black text-gray-900 italic mb-6">How Nudge Thinks.</h3>
              <p className="text-gray-500 leading-relaxed">Systematic translation of intent into system-level operations.</p>
            </div>

            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
              {workflow.map((item, i) => (
                <div
                  key={i}
                  className="card-glow group relative rounded-3xl bg-white border border-gray-200
                             hover:border-transparent hover:-translate-y-1
                             shadow-sm hover:shadow-2xl hover:shadow-black/15
                             transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                    <svg className="w-full h-full" style={{ overflow: 'visible' }}>
                      <defs>
                        <linearGradient id={`beam-grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%"   stopColor="#10b981" stopOpacity="0" />
                          <stop offset="30%"  stopColor="#10b981" stopOpacity="1" />
                          <stop offset="70%"  stopColor="#14b8a6" stopOpacity="1" />
                          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <rect
                        x="1" y="1"
                        width="calc(100% - 2px)"
                        height="calc(100% - 2px)"
                        rx="23"
                        fill="none"
                        stroke={`url(#beam-grad-${i})`}
                        strokeWidth="2.5"
                        className="beam-path"
                      />
                    </svg>
                  </div>

                  <div className="relative z-10 p-8 h-full">
                    <div className="flex justify-between items-center mb-6">
                      <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-emerald-50 transition-colors duration-300">
                        {item.icon}
                      </div>
                      <span className="text-3xl font-black text-gray-100 italic group-hover:text-emerald-100 transition-colors duration-300">
                        {item.step}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>
    </>
  );
}