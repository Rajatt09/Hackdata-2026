import React from 'react';
import { Globe, Zap, Code2 } from 'lucide-react';

export default function AboutSection({ desktopImg, mobileImg }) {
  const items = [
    { 
      icon: <Globe size={18} className="text-blue-500" />, 
      title: "Global Reach", 
      text: "Control your machine from any remote connection without VPNs." 
    },
    { 
      icon: <Code2 size={18} className="text-purple-500" />, 
      title: "JS Tooling", 
      text: "Custom logic powered by extensible JavaScript files." 
    },
    { 
      icon: <Zap size={18} className="text-amber-500" />, 
      title: "Ultra Lightweight", 
      text: "Minimal CPU footprint for instant system execution." 
    }
  ];

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto relative z-10 content-layer">
      <div className="grid lg:grid-cols-[5fr_7fr] gap-16 items-center">
        
        <div className="space-y-6 text-left">
          <h2 className="text-4xl font-bold tracking-tight text-black">
            Total control. <span className="text-gray-400">Zero network limits.</span>
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed font-medium">
            Nudge turns complex system operations into simple chat commands. 
            Fetch files, stream data, and open apps from anywhere in the world.
          </p>
          <ul className="space-y-6 pt-4">
            {items.map((item, i) => (
              <li key={i} className="flex flex-col gap-1">
                <div className="flex items-center gap-2 font-bold text-gray-900 text-sm">
                  {item.icon} {item.title}
                </div>
                <p className="text-sm text-gray-500 ml-7">{item.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative pt-10 pb-16 pr-16">
          
          <div className="relative z-0 group">
            <div className="absolute -inset-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-2xl blur opacity-20" />
            <div className="relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:scale-[1.01]">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"/>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"/>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-300"/>
              </div>
              <img 
                src={desktopImg = "fed98fe8-5efd-495f-844a-e0ce5be74127.jpeg"} 
                alt="Laptop Interface" 
                className="w-full h-auto grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700" 
              />
            </div>
          </div>

          <div className="absolute -bottom-10 -right-4 md:-right-8 z-20 w-[140px] md:w-[210px] group/phone">
            <div className="relative border-gray-900 bg-gray-900 border-[8px] md:border-[12px] rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] transform group-hover/phone:-translate-y-3 transition-all duration-500">
              <div className="w-16 h-4 bg-gray-900 top-0 left-1/2 -translate-x-1/2 absolute rounded-b-2xl z-30" />
              <div className="rounded-[1.8rem] overflow-hidden aspect-[9/19] bg-white">
                <img 
                  src={mobileImg = "index.jpeg"} 
                  alt="Mobile Interface" 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}