import React from 'react';
import { ArrowRight, BrainCircuit, TerminalSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { LaptopFrame, MobileFrame } from './DeviceFrames';

export function InteractionDemo({ phoneImg, laptopImg = "" }) {
    return (
        <section className="py-32">
            <div className="max-w-7xl mx-auto px-6 text-center">
                
                {/* Updated Heading & Context */}
                <div className="max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
                        The Zero-Leakage Execution Pipeline
                    </h2>
                    <p className="text-lg text-gray-600 font-medium">
                        Watch how Nudge strictly uses the LLM as a cognitive router. Your natural language intent is analyzed in the cloud, but the actual execution and data retrieval happen natively—and privately—on your local machine.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-8 lg:gap-12 relative">
                    
                    {/* Left: Mobile Interface */}
                    <div className="flex-1 w-full max-w-sm">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                            1. Remote Interface
                        </p>
                        <MobileFrame>
                            <img src={phoneImg = "55f10441-27bb-400d-b0bd-e09c334b8afd.jpeg"} alt="Mobile Interface" className="w-full h-full object-cover" />
                        </MobileFrame>
                    </div>

                    {/* Middle: Prominent Architecture Bridge */}
                    <div className="relative flex flex-col items-center gap-4 px-6 py-8 border border-gray-200 rounded-3xl bg-gray-50/80 backdrop-blur-md shadow-lg z-10 md:min-w-[280px]">
                        
                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3 text-blue-600">
                                <BrainCircuit size={20} />
                            </div>
                            <p className="text-[11px] font-black uppercase text-blue-600 tracking-wider mb-1">
                                Cognitive Router
                            </p>
                            <p className="text-sm font-medium text-gray-700 leading-tight">
                                AI matches your intent <br/> to predefined <span className="font-bold">Skills</span>
                            </p>
                        </div>

                        <div className="my-2 text-gray-300">
                            {/* Rotates arrow pointing down on mobile, right on desktop */}
                            <ArrowRight size={24} className="rotate-90 md:rotate-0" />
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3 text-emerald-600">
                                <TerminalSquare size={20} />
                            </div>
                            <p className="text-[11px] font-black uppercase text-emerald-600 tracking-wider mb-1">
                                Local Engine
                            </p>
                            <p className="text-sm font-medium text-gray-700 leading-tight">
                                Nudge securely executes <br/> native <span className="font-bold">Tools</span>
                            </p>
                        </div>
                    </div>

                    {/* Right: Host Machine */}
                    <div className="flex-1 w-full max-w-2xl">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
                            2. Host Machine Execution
                        </p>
                        <LaptopFrame>
                            <img src={laptopImg = "72ce76cd-eca3-4f16-a7da-6f9e042a3fe8.jpeg"} alt="System Reality" className="w-full h-full object-cover" />
                        </LaptopFrame>
                    </div>
                </div>
            </div>
        </section>
    );
}