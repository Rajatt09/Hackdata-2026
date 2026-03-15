import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { LaptopFrame, MobileFrame } from './DeviceFrames';

export function InteractionDemo({ phoneImg, laptopImg = "" }) {
    return (
        <section className="py-40">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <h2 className="text-3xl font-bold mb-24 tracking-tight">Anywhere Command Execution</h2>

                <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">User Interface</p>
                        <MobileFrame>
                            <img src={phoneImg = "55f10441-27bb-400d-b0bd-e09c334b8afd.jpeg"} alt="Mobile" className="w-full h-full object-cover" />
                        </MobileFrame>
                    </div>

                    <div className="relative px-6 py-4 border border-dashed border-gray-200 rounded-2xl bg-white/50 backdrop-blur-sm">
                        <p className="text-[10px] font-black uppercase text-emerald-500 mb-1">Architecture Flow</p>
                        <p className="text-xs font-medium text-gray-600 italic whitespace-nowrap">
                            Command Intent <span className="mx-2 text-gray-300">→</span> Native Execution
                        </p>
                    </div>

                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">System Reality</p>
                        <LaptopFrame>
                            <img src={laptopImg = "72ce76cd-eca3-4f16-a7da-6f9e042a3fe8.jpeg"} alt="Laptop" className="w-full h-full object-cover" />
                        </LaptopFrame>
                    </div>
                </div>
            </div>
        </section>
    );
}