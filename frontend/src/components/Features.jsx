import { Cpu, Send, FileCode, Bot, Globe, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const featureList = [
  { title: "System Control", desc: "Native access to files and utilities.", icon: <Cpu size={18} /> },
  { title: "Global Access", desc: "Remote control without network pairing.", icon: <Globe size={18} /> },
  { title: "JS Tooling", desc: "Custom scripts for native execution.", icon: <FileCode size={18} /> },
  { title: "Intent Engine", desc: "LLM-powered semantic tool matching.", icon: <Bot size={18} /> },
  { title: "Zero Latency", desc: "Direct local execution through agents.", icon: <Send size={18} /> },
  { title: "Local First", desc: "Private execution on your machine.", icon: <Shield size={18} /> }
];

export default function Features() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12">
      {featureList.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="group relative p-8 rounded-2xl border border-gray-400/60 bg-gray-100
                     hover:bg-white hover:border-emerald-400 hover:-translate-y-1
                     hover:shadow-xl hover:shadow-black/10
                     transition-all duration-300 cursor-default"
        >
          <div className="flex items-center gap-3 mb-4 border-l-2 border-transparent group-hover:border-emerald-500 pl-4 transition-all duration-300">
            <div className="p-2 bg-gray-200 rounded-lg text-gray-600 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-all duration-300">
              {item.icon}
            </div>
            <h3 className="font-bold text-gray-900 tracking-tight">{item.title}</h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed pl-14">
            {item.desc}
          </p>
        </motion.div>
      ))}
    </div>
  );
}