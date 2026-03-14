import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function Terminal() {
  const [copied, setCopied] = useState(false);
  const command = "npm install -g nudge-cli";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-[#0b0b0b] rounded-xl border border-white/10 shadow-2xl overflow-hidden">

        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-white transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Terminal body */}
        <div className="px-7 py-5 font-mono text-base sm:text-lg text-left flex flex-col gap-2.5">
          {/* Comment line */}
          <span className="text-gray-500 text-sm sm:text-base select-none">
           # Execute this command to initialize the Nudge agent locally.
          </span>

          {/* Command line */}
          <div className="flex items-center gap-3">
            <span className="text-gray-600 select-none font-bold">❯</span>
            <code className="text-gray-100">{command}</code>
          </div>
        </div>

      </div>
    </div>
  );
}