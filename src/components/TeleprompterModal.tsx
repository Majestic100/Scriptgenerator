import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Type, MoveVertical } from 'lucide-react';
import { GeneratedScript, HookItem } from '../types';

interface TeleprompterModalProps {
  script: GeneratedScript;
  selectedHook: HookItem;
  onClose: () => void;
}

export const TeleprompterModal: React.FC<TeleprompterModalProps> = ({
  script,
  selectedHook,
  onClose
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2); // 1 to 5
  const [fontSize, setFontSize] = useState(28); // px
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        if (containerRef.current) {
          containerRef.current.scrollTop += speed;
        }
      }, 30);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed]);

  const handleReset = () => {
    setIsPlaying(false);
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col justify-between p-4 md:p-8 animate-fadeIn">
      
      {/* Top bar controls */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 max-w-4xl mx-auto w-full">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎥 Teleprompter Mode</span>
          </h3>
          <p className="text-base text-slate-400">
            {script.title} · {script.companyName}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Font size */}
          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-md border border-slate-700">
            <Type className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button
              onClick={() => setFontSize(Math.max(18, fontSize - 4))}
              className="px-2 py-0.5 text-base text-slate-300 hover:text-white bg-slate-700/50 rounded cursor-pointer"
            >
              A-
            </button>
            <span className="text-base font-mono text-red-300 w-6 text-center font-bold">{fontSize}</span>
            <button
              onClick={() => setFontSize(Math.min(48, fontSize + 4))}
              className="px-2 py-0.5 text-base text-slate-300 hover:text-white bg-slate-700/50 rounded cursor-pointer"
            >
              A+
            </button>
          </div>

          {/* Speed */}
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1 rounded-md border border-slate-700 text-base">
            <MoveVertical className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Hastighed:</span>
            <input
              type="range"
              min={1}
              max={6}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="w-16 accent-[#E52328] cursor-pointer"
            />
          </div>

          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-4 py-2 rounded-md font-bold text-base flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold'
                : 'bg-[#E52328] hover:bg-[#c81e22] text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'Pause' : 'Start Scroll'}</span>
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md cursor-pointer"
            title="Nulstil"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-md border border-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main scrolling text area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto max-w-3xl mx-auto w-full my-6 py-12 px-6 scroll-smooth border-y border-slate-800/60 bg-slate-900/40 rounded-2xl"
        style={{ fontSize: `${fontSize}px`, leading: '1.6' }}
      >
        {/* Eye level marker */}
        <div className="sticky top-1/3 left-0 right-0 h-0.5 bg-indigo-500/30 pointer-events-none flex items-center justify-end">
          <span className="text-sm text-indigo-400 bg-slate-900 px-2 rounded-full border border-indigo-500/30 -mr-8">
            ØJENHØJDE
          </span>
        </div>

        <div className="space-y-12 text-center text-slate-100 font-medium">
          
          {/* Selected Hook */}
          <div className="p-6 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl">
            <span className="text-base uppercase font-bold text-indigo-400 tracking-widest block mb-2">
              HOOK {selectedHook.hookNumber} ({selectedHook.angleType})
            </span>
            <p className="font-bold text-indigo-100 leading-snug">
              "{selectedHook.audioDialogue}"
            </p>
            <span className="text-base text-indigo-300/70 block mt-2 font-normal">
              Visuelt: {selectedHook.visualDirection}
            </span>
          </div>

          {/* Body Scenes */}
          {script.scenes.map((scene, idx) => (
            <div key={scene.id} className="p-4 rounded-xl space-y-2">
              <div className="text-base text-slate-400 uppercase tracking-wider font-semibold">
                Scene {idx + 1} [{scene.timecode}] · {scene.section}
              </div>
              <p className="font-semibold text-slate-100 leading-relaxed">
                "{scene.audioDialogue}"
              </p>
              {scene.textOnScreen && (
                <div className="text-lg text-amber-300/80 font-normal">
                  Tekst på skærmen: {scene.textOnScreen}
                </div>
              )}
            </div>
          ))}

          {/* CTA */}
          <div className="p-6 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
            <span className="text-base uppercase font-bold text-emerald-400 tracking-widest block mb-2">
              CALL TO ACTION
            </span>
            <p className="font-bold text-emerald-100">
              "{script.callToAction}"
            </p>
          </div>

        </div>
      </div>

      {/* Footer hint */}
      <div className="text-center text-base text-slate-500">
        Placér din mobil eller kamera direkte bag skærmen ved øjenhøjde-linjen for naturlig øjenkontakt.
      </div>

    </div>
  );
};
