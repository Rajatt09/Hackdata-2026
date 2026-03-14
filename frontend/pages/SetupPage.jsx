import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Terminal as TerminalIcon, Hash } from 'lucide-react';
import Navbar from '../src/components/Navbar';

const commands = [
  {
    id: 'init',
    title: 'nudge init',
    description: 'Initializes the Nudge agent. This command allows you to select your preferred LLM (like Gemini or GPT) and securely save your API keys.',
    command: 'nudge init',
    output: [
      '✔ Select a model › gemini-1.5-pro (google)',
      '✔ Enter API key ... ********',
      '✔ Configuration saved',
      'Model selected: gemini-1.5-pro'
    ]
  },
  {
    id: 'start',
    title: 'nudge start',
    description: 'Starts the Nudge agent process on your local machine. Once started, the agent is ready to receive commands remotely.',
    command: 'nudge start',
    output: [
      '✔ Nudge agent started'
    ]
  },
  {
    id: 'status',
    title: 'nudge status',
    description: 'Checks the current state of the Nudge agent, including its running status, active model, and uptime.',
    command: 'nudge status',
    output: [
      '● Nudge Agent: RUNNING',
      'Model: gemini-1.5-pro',
      'Started At: 2026-03-14T13:42:19.534Z'
    ]
  },
  {
    id: 'stop',
    title: 'nudge stop',
    description: 'Gracefully shuts down the Nudge agent and stops all active system listeners.',
    command: 'nudge stop',
    output: [
      '✔ Nudge agent stopped'
    ]
  },
  {
    id: 'model',
    title: 'nudge model',
    description: 'Updates the LLM model configuration without requiring a full re-initialization.',
    command: 'nudge model',
    output: [
      '✔ Select a new model › gpt-4.1 (openai)',
      '✔ Model updated'
    ]
  },
  {
    id: 'auth',
    title: 'nudge auth',
    description: 'Updates the authentication credentials and API keys for the configured provider.',
    command: 'nudge auth',
    output: [
      '✔ Enter new API key ... ************',
      '✔ API key updated'
    ]
  }
];

const TerminalBlock = ({ text, isOutput = false }) => {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group rounded-xl overflow-hidden border ${isOutput ? 'bg-[#0b0b0b] border-white/5' : 'bg-gray-50 border-gray-200'} mb-4`}>
      {!isOutput && (
        <button onClick={copy} className="absolute right-3 top-3 p-1.5 rounded-md hover:bg-gray-200 transition-colors">
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} className="text-gray-400" />}
        </button>
      )}
      <div className="p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap">
        {isOutput ? (
          <div className="space-y-1">
            {text.map((line, i) => (
              <div key={i} className={line.startsWith('✔') ? 'text-emerald-400' : line.startsWith('●') ? 'text-emerald-500 font-bold' : 'text-gray-400'}>
                {line}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-emerald-600 font-bold select-none">❯</span>
            <span className="text-gray-900">{text}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SetupPage() {
  const [activeId, setActiveId] = useState('init');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { threshold: 0.5 }
    );

    commands.forEach((cmd) => {
      const el = document.getElementById(cmd.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 flex gap-12">
        {/* Left Sidebar */}
        <aside className="hidden lg:block w-64 sticky top-32 h-fit">
          <nav className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4 px-3">Setup Guide</p>
            {commands.map((cmd) => (
              <a
                key={cmd.id}
                href={`#${cmd.id}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeId === cmd.id ? 'bg-emerald-50 text-emerald-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Hash size={14} className={activeId === cmd.id ? 'text-emerald-500' : 'text-gray-300'} />
                {cmd.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-3xl">
          <header className="mb-16">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 mb-4">Command Reference</h1>
            <p className="text-lg text-gray-600">
              Configure and manage your Nudge agent using these core CLI commands. Each command is lightweight and optimized for system-level execution.
            </p>
          </header>

          <div className="space-y-24">
            {commands.map((cmd) => (
              <section key={cmd.id} id={cmd.id} className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <TerminalIcon size={20} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{cmd.title}</h2>
                </div>
                
                <p className="text-gray-600 mb-8 leading-relaxed">
                  {cmd.description}
                </p>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Command</p>
                  <TerminalBlock text={cmd.command} />
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Expected Output</p>
                  <TerminalBlock text={cmd.output} isOutput />
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}