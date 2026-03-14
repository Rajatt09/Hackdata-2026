import React from 'react';

export const MobileFrame = ({ children }) => (
  <div className="relative mx-auto border-gray-900 bg-gray-900 border-[12px] rounded-[2.5rem] h-[500px] w-[250px] shadow-2xl overflow-hidden">
    {/* This {children} is what allows the <img> to show up! */}
    {children} 
  </div>
);

// src/components/DeviceFrames.jsx

export const LaptopFrame = ({ children }) => (
  <div className="relative w-full max-w-5xl mx-auto group">
    {/* Outer Shell */}
    <div className="relative border-gray-800 bg-gray-800 border-[6px] md:border-[10px] rounded-t-2xl shadow-2xl overflow-hidden">
      
      {/* Change: aspect-[21/9] makes it much wider and shorter.
          Change: bg-[#0b0b0b] matches the dark terminal aesthetic.
      */}
      <div className="bg-[#0b0b0b] aspect-[21/9] w-full overflow-hidden">
        {children}
      </div>
    </div>
    
    {/* Thin Laptop Base / Hinge */}
    <div className="relative bg-gray-900 rounded-b-2xl h-2 md:h-3 w-full shadow-lg" />
  </div>
);
export const DeviceOverlap = ({ desktopImg, mobileImg }) => (
  <div className="relative w-full max-w-4xl mx-auto pt-10 pb-20">
    {/* Desktop Frame */}
    <div className="relative z-0 border-gray-800 bg-gray-800 border-[8px] rounded-t-xl shadow-2xl scale-110 md:scale-100">
      <div className="rounded-lg overflow-hidden h-[200px] md:h-[400px] bg-white">
        <img src={desktopImg} className="w-full h-full object-cover" alt="Desktop UI" />
      </div>
      <div className="relative bg-gray-900 rounded-b-xl h-[12px] md:h-[20px] w-full" />
    </div>

    {/* Overlapping Mobile Frame */}
    <div className="absolute -bottom-10 -right-4 md:right-10 z-20 w-[140px] md:w-[220px] border-gray-900 bg-gray-900 border-[10px] rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] transform hover:-translate-y-2 transition-transform duration-500">
      <div className="w-16 h-4 bg-gray-900 top-0 left-1/2 -translate-x-1/2 absolute rounded-b-2xl z-30" />
      <div className="rounded-[1.8rem] overflow-hidden aspect-[9/19] bg-white">
        <img src={mobileImg} className="w-full h-full object-cover" alt="Mobile UI" />
      </div>
    </div>
  </div>
);