import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScriptForm } from './components/ScriptForm';
import { ScriptCard } from './components/ScriptCard';
import { AiTrainingModal } from './components/AiTrainingModal';
import { ProjectsModal } from './components/ProjectsModal';
import { SaveToProjectModal } from './components/SaveToProjectModal';
import { TeleprompterModal } from './components/TeleprompterModal';
import { GeneratedScript, ScriptRequest, Project, AiTrainingItem, AiTrainingType } from './types';
import { AlertCircle, RefreshCw, CheckCircle2, Copy, Check, FileText, FileDown } from 'lucide-react';
import { formatAllScriptsToHtml, formatAllScriptsToPlainText, copyFormattedToClipboard } from './utils/formatUtils';
import { downloadScriptsAsDocx, downloadScriptsAsPdf } from './utils/exportUtils';

export default function App() {
  const [generatedScripts, setGeneratedScripts] = useState<GeneratedScript[]>([]);
  const [documentTitle, setDocumentTitle] = useState('JP Køl og Klima - Script 2');
  const [aiTrainingItems, setAiTrainingItems] = useState<AiTrainingItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAiTrainingOpen, setIsAiTrainingOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isSaveToProjectModalOpen, setIsSaveToProjectModalOpen] = useState(false);
  const [selectedScriptForSave, setSelectedScriptForSave] = useState<GeneratedScript | null>(null);
  const [teleprompterScript, setTeleprompterScript] = useState<GeneratedScript | null>(null);
  const [formData, setFormData] = useState<Partial<ScriptRequest>>({});
  const [copiedAll, setCopiedAll] = useState(false);

  // Enforce light theme
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    try {
      localStorage.setItem('meta_ads_theme', 'light');
    } catch {}
  }, []);

  // Fetch Projects from backend Express server (/api/projects)
  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
      }
    } catch (err) {
      console.error('Kunne ikke indlæse projekter:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch AI Training Items from backend (/api/ai-training)
  const fetchAiTrainingItems = async () => {
    try {
      const res = await fetch('/api/ai-training');
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setAiTrainingItems(data.items);
      }
    } catch (err) {
      console.error('Kunne ikke hente AI træningseksempler:', err);
    }
  };

  useEffect(() => {
    fetchAiTrainingItems();
  }, []);

  const handleAddAiTrainingItem = async (type: AiTrainingType, text: string, title?: string, brandContext?: string) => {
    try {
      const res = await fetch('/api/ai-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, text, title, brandContext })
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setAiTrainingItems(data.items);
      }
    } catch (err) {
      console.error('Fejl ved tilføjelse af AI træningseksempel:', err);
    }
  };

  const handleDeleteAiTrainingItem = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-training/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        setAiTrainingItems(data.items);
      }
    } catch (err) {
      console.error('Fejl ved sletning af AI træningseksempel:', err);
    }
  };

  // Submit handler to call backend Express endpoint /api/generate-scripts
  const handleGenerateScripts = async (request: ScriptRequest) => {
    setIsLoading(true);
    setErrorMessage(null);

    if (request.documentTitle) {
      setDocumentTitle(request.documentTitle);
    }

    try {
      const response = await fetch('/api/generate-scripts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Der opstod en uventet fejl ved generering af scripts.');
      }

      setGeneratedScripts(data.scripts || []);
      
      // Scroll smoothly down to results
      setTimeout(() => {
        const resultsEl = document.getElementById('generated-results');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);

    } catch (err: any) {
      console.error('Genereringsfejl:', err);
      setErrorMessage(err.message || 'Der kunne ikke oprettes forbindelse til serveren.');
    } finally {
      setIsLoading(false);
    }
  };

  // Preset example loader
  const handleLoadExample = (key: string) => {
    if (key === 'ecommerce') {
      setFormData({
        companyName: 'Naturhud Skincare',
        competitors: ['ClinicalGlow', 'DermaCare', 'PureBio'],
        numScripts: 2,
        numHooksPerScript: 3,
        bodyDuration: '30 sekunder',
        scriptType: 'UGC (User Generated Content)',
        productDescription: 'Dansk udviklet økologisk ansigtsserum med hyaluronsyre mod uren og tør hud.',
        targetAudience: 'Kvinder 25-45 år der ønsker en naturlig glød uden kemikalier.',
        offerOrCta: 'Spar 20% på dit første køb i dag + gratis levering.',
        language: 'da'
      });
    } else if (key === 'saas') {
      setFormData({
        companyName: 'TaskFlow App',
        competitors: ['Monday.com', 'Asana', 'ClickUp'],
        numScripts: 2,
        numHooksPerScript: 3,
        bodyDuration: '30 sekunder',
        scriptType: 'Comparison (Us vs Competitors)',
        productDescription: 'Simpelt projektstyringsværktøj til danske bureauer uden bureaukrati og rod.',
        targetAudience: 'Bureauejere og projektledere der er trætte af overkomplicerede værktøjer.',
        offerOrCta: 'Start 14 dages gratis prøveperiode - intet kreditkort påkrævet.',
        language: 'da'
      });
    } else if (key === 'fitness') {
      setFormData({
        companyName: 'FitPulse Studio',
        competitors: ['FitnessWorld', 'PureGym'],
        numScripts: 2,
        numHooksPerScript: 3,
        bodyDuration: '45 sekunder',
        scriptType: 'PAS (Problem - Agitate - Solution)',
        productDescription: 'Intime holdtræninger med personlig træner og garanteret motivation.',
        targetAudience: 'Travle folk der mister motivationen i store kommercielle fitnesscentre.',
        offerOrCta: 'Få 1. måned til halv pris + en gratis kropsanalyse.',
        language: 'da'
      });
    }
  };

  const handleUpdateScript = (scriptIndex: number, updatedScript: GeneratedScript) => {
    setGeneratedScripts((prev) => {
      const next = [...prev];
      next[scriptIndex] = updatedScript;
      return next;
    });
  };

  const handleCopyAllScripts = async () => {
    if (generatedScripts.length === 0) return;
    const htmlContent = formatAllScriptsToHtml(generatedScripts);
    const plainTextContent = formatAllScriptsToPlainText(generatedScripts);
    await copyFormattedToClipboard(htmlContent, plainTextContent);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="min-h-screen bg-studio text-ink flex flex-col font-sans selection:bg-rec selection:text-white">
      
      {/* Top Navbar Header */}
      <Navbar
        aiTrainingCount={aiTrainingItems.length}
        onOpenAiTraining={() => setIsAiTrainingOpen(true)}
        projectsCount={projects.length}
        onOpenProjects={() => setIsProjectsModalOpen(true)}
        onLoadExample={handleLoadExample}
      />

      {/* Hero / Main Area */}
      <main className="flex-1 max-w-[1536px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 md:py-8 space-y-8">
        
        {/* Call sheet-hoved */}
        <div className="pt-3 pb-4 border-b-2 border-ink">
          <p className="eyebrow text-ink/45 mb-2.5">Produktionsværktøj · Meta video-annoncer</p>
          <h1 className="font-display text-4xl sm:text-5xl uppercase leading-[0.95] text-ink">
            Script Generator<span className="text-rec">.</span>
          </h1>
        </div>

        {/* Script Configurator Form */}
        <ScriptForm
          key={JSON.stringify(formData)} // re-render when preset loaded
          initialData={formData}
          onSubmit={handleGenerateScripts}
          isLoading={isLoading}
        />

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-900 text-sm animate-fadeIn">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-red-900">Kunne ikke generere script</span>
              <p className="text-xs mt-0.5 text-red-700">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* GENERATED RESULTS SECTION */}
        {generatedScripts.length > 0 && (
          <div id="generated-results" className="space-y-6 pt-6 animate-fadeIn">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-ink/10 rounded-lg p-4 shadow-sm">
              <div className="flex-1 space-y-1">
                <label className="eyebrow text-slate-500 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rec" />
                  <span>Dokument Titel (Vises øverst på eksporteret PDF & Docs)</span>
                </label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="f.eks. JP Køl og Klima - Script 2"
                  className="w-full bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rec/20 focus:border-rec rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-900 transition-all shadow-2xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-end">
                <button
                  onClick={() => downloadScriptsAsDocx(generatedScripts, documentTitle)}
                  className="px-4 py-2.5 bg-ink hover:bg-black text-white rounded-md text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  title="Download alle scripts som Google Docs (.docx) - 1 script pr. side"
                >
                  <FileText className="w-4 h-4 text-white" />
                  <span>Download Docs (.docx)</span>
                </button>

                <button
                  onClick={() => downloadScriptsAsPdf(generatedScripts, documentTitle)}
                  className="px-4 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 text-ink rounded-md text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  title="Download alle scripts som PDF (.pdf) - 1 script pr. side"
                >
                  <FileDown className="w-4 h-4 text-ink" />
                  <span>Download PDF (.pdf)</span>
                </button>

                <button
                  onClick={handleCopyAllScripts}
                  className="px-3.5 py-2.5 bg-rec hover:bg-[#c81e22] text-white rounded-md text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Kopiér alle scripts med perfekt Google Docs formatering (Arial 11pt)"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Kopieret alle!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-white" />
                      <span>Kopiér alle</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    const el = document.querySelector('form');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-semibold text-ink flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rec" />
                  <span>Nye parametre</span>
                </button>
              </div>
            </div>

            {/* Render Each Script Card */}
            <div className="space-y-6">
              {generatedScripts.map((script, idx) => {
                const startHookNumber = generatedScripts
                  .slice(0, idx)
                  .reduce((sum, s) => sum + (s.hooks?.length || 0), 0);
                return (
                  <ScriptCard
                    key={script.id}
                    script={script}
                    scriptIndex={idx}
                    startHookNumber={startHookNumber}
                    onUpdateScript={(updated) => handleUpdateScript(idx, updated)}
                    onSaveToProject={(s) => {
                      setSelectedScriptForSave(s);
                      setIsSaveToProjectModalOpen(true);
                    }}
                    onSaveToAiTraining={handleAddAiTrainingItem}
                  />
                );
              })}
            </div>

          </div>
        )}

      </main>

      {/* AI Training & Gold Standards Modal */}
      <AiTrainingModal
        isOpen={isAiTrainingOpen}
        onClose={() => setIsAiTrainingOpen(false)}
        items={aiTrainingItems}
        onAddItem={handleAddAiTrainingItem}
        onDeleteItem={handleDeleteAiTrainingItem}
        onAdd={handleAddAiTrainingItem}
        onDelete={handleDeleteAiTrainingItem}
      />

      {/* Projects Management Modal */}
      <ProjectsModal
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        projects={projects}
        onRefreshProjects={fetchProjects}
        onOpenTeleprompter={(script) => setTeleprompterScript(script)}
        onSelectScript={(script) => {
          setGeneratedScripts([script]);
          setTimeout(() => {
            const resultsEl = document.getElementById('generated-results');
            if (resultsEl) resultsEl.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
      />

      {/* Save Script to Project Modal */}
      <SaveToProjectModal
        isOpen={isSaveToProjectModalOpen}
        onClose={() => {
          setIsSaveToProjectModalOpen(false);
          setSelectedScriptForSave(null);
        }}
        script={selectedScriptForSave}
        projects={projects}
        onRefreshProjects={fetchProjects}
      />

      {/* Teleprompter Modal */}
      {teleprompterScript && (
        <TeleprompterModal
          script={teleprompterScript}
          selectedHook={teleprompterScript.hooks?.[0] || { id: 'h0', hookNumber: 1, angleType: 'Standard', visualDirection: '', textOnScreen: '', audioDialogue: '', estimatedDurationSec: 3 }}
          onClose={() => setTeleprompterScript(null)}
        />
      )}

    </div>
  );
}
