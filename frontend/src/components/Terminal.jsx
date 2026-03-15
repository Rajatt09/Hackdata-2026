import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function Terminal() {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('bash');

  const commands = {
    bash: {
      title: "Mac / Linux / Git Bash",
      cmd: "curl -sL https://raw.githubusercontent.com/Rajatt09/Hackdata-2026/main/install.sh | bash",
      comment: "# Execute this command to install the Nudge CLI globally."
    },
    powershell: {
      title: "Windows (PowerShell)",
      cmd: "Invoke-WebRequest -Uri \"https://raw.githubusercontent.com/Rajatt09/Hackdata-2026/main/install.ps1\" -OutFile \"install.ps1\"; .\\install.ps1",
      comment: "# Note: You will need to create an install.ps1 script in your repo"
    },
    npm: {
      title: "Local Development",
      cmd: "git clone !!REPO_URL!! && cd Hackdata-2026/cli && npm i && npm link --force",
      comment: "# Clone the repo and link the CLI locally"
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(commands[activeTab].cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-fit mx-auto">
      <div className="bg-[#0b0b0b] rounded-xl border border-white/10 shadow-2xl overflow-hidden w-[850px] max-w-full">
        
        {/* Title bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/5">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          
          {/* Tabs */}
          <div className="flex gap-4">
            {Object.entries(commands).map(([key, data]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`text-[11px] cursor-pointer font-bold uppercase tracking-wide transition-colors ${
                  activeTab === key ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {data.title}
              </button>
            ))}
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
        <div className="px-7 py-5 font-mono text-base sm:text-lg text-left flex flex-col gap-2.5 min-h-[120px]">
          {/* Comment line */}
          <span className="text-gray-500 text-sm sm:text-base select-none">
           {commands[activeTab].comment}
          </span>

          {/* Command line */}
          <div className="flex gap-3">
            <span className="text-gray-600 select-none font-bold shrink-0 mt-0.5">❯</span>
            <code className="text-gray-100 break-all">{commands[activeTab].cmd}</code>
          </div>
        </div>

      </div>
    </div>
  );
}