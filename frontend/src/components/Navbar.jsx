import React, { useState } from 'react';
import { Rocket, Github } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 w-fit">
      
      {/* 1. The Main Pill Navbar */}
      <nav className="flex items-center gap-8 px-6 h-12 bg-white/70 backdrop-blur-xl border border-gray-200 rounded-full shadow-sm">
        <Link 
          to="/" 
          className="text-sm font-medium text-gray-500 hover:text-black transition-colors"
        >
          Home
        </Link>
        
        <Link 
          to="/setup" 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative flex items-center justify-center bg-black -mr-4 text-white px-2 h-10 rounded-full text-sm font-medium overflow-hidden min-w-[100px]"
        >
          <span className={`transition-transform duration-300 ${isHovered ? '-translate-x-3' : 'translate-x-0'}`}>
            Setup
          </span>
          <Rocket 
            size={14} 
            className={`absolute right-4 transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`} 
          />
        </Link>
      </nav>

      {/* 2. The Detached GitHub Button */}
      <a 
        href="https://github.com/your-username/nudge" 
        target="_blank" 
        rel="noopener noreferrer"
        /* h-12 matches the height of the white navbar pill exactly */
        className="h-12 aspect-square flex items-center justify-center bg-black rounded-full shadow-lg hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 group"
        aria-label="View on GitHub"
      >
        <Github 
          size={20} 
          strokeWidth={2} 
          className="text-white group-hover:rotate-12 transition-transform" 
        />
      </a>
      
    </div>
  );
}