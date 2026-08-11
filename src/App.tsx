import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScriptForm } from './components/ScriptForm';
import { ScriptCard } from './components/ScriptCard';
import { AiTrainingModal } from './components/AiTrainingModal';
import { ProjectsModal } from './components/ProjectsModal';
import { SaveToProjectModal } from './components/SaveToProjectModal';
import { TeleprompterModal } from './components/TeleprompterModal';
import { CustomersModal } from './components/CustomersModal';
import { LoginScreen } from './components/LoginScreen';
import { buttonStyles } from './components/ui';
import { GeneratedScript, ScriptRequest, Project, AiTrainingItem, AiTrainingType, Customer, AppUserInfo } from './types';
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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isCustomersModalOpen, setIsCustomersModalOpen] = useState(false);
  const [authState, setAuthState] = useState<'loading' | 'login' | 'ready'>('loading');
  const [currentUser, setCurrentUser] = useState<AppUserInfo | null>(null);
  // Fælles kode til alle => ingen virksomhedsadskillelse => skjul "fælles"-valgene
  const teamsEnabled = !!currentUser && currentUser.company !== 'alle';

  // Tjek adgang ved start
  useEffect(() => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((d) => {
        setCurrentUser(d.user || null);
        setAuthState(d.required && !d.authed ? 'login' : 'ready');
      })
      .catch(() => setAuthState('ready'));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUser(null);
    setAuthState('login');
  };

  const refreshCurrentUser = () => {
    fetch('/api/auth/status')
      .then((r) => r.json())
      .then((d) => setCurrentUser(d.user || null))
      .catch(() => {});
  };

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
    if (authState === 'ready') fetchProjects();
  }, [authState]);

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
    if (authState === 'ready') fetchAiTrainingItems();
  }, [authState]);

  // Kundekartotek (/api/customers)
  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success && Array.isArray(data.customers)) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error('Kunne ikke hente kunder:', err);
    }
  };

  useEffect(() => {
    if (authState === 'ready') fetchCustomers();
  }, [authState]);

  // Vælg kunde: udfylder formularen med al gemt kundeinfo inkl. analyse
  const handleSelectCustomer = (customer: Customer) => {
    setFormData({
      documentTitle: `${customer.companyName || customer.name} - Scripts`,
      companyName: customer.companyName || customer.name,
      companyWebsite: customer.companyWebsite || '',
      productName: customer.productName || '',
      productDescription: customer.productDescription || '',
      targetAudience: customer.targetAudience || '',
      demographics: customer.demographics || '',
      offerOrCta: customer.offerOrCta || '',
      competitors: customer.competitors || [],
      toneOfVoice: customer.toneOfVoice || '',
      analysisDocument: customer.analysisDocument?.extractedText
        ? {
            name: customer.analysisDocument.name,
            mimeType: 'text/plain',
            base64: '',
            extractedText: customer.analysisDocument.extractedText
          }
        : undefined
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Gem formularens nuværende indhold som kunde
  const handleSaveAsCustomer = async (data: Partial<ScriptRequest>) => {
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.companyName,
          companyName: data.companyName,
          companyWebsite: data.companyWebsite,
          productName: data.productName,
          productDescription: data.productDescription,
          targetAudience: data.targetAudience,
          demographics: data.demographics,
          offerOrCta: data.offerOrCta,
          competitors: data.competitors,
          toneOfVoice: data.toneOfVoice,
          analysisDocument: data.analysisDocument
        })
      });
      const result = await res.json();
      if (result.success) {
        fetchCustomers();
        alert(`"${data.companyName}" er gemt som kunde. Fremover kan du vælge kunden under "Kunder" i toppen.`);
      } else {
        alert(result.error || 'Kunden kunne ikke gemmes.');
      }
    } catch (err) {
      console.error('Fejl ved gem som kunde:', err);
      alert('Kunden kunne ikke gemmes. Prøv igen.');
    }
  };

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

  if (authState === 'loading') {
    return <div className="min-h-[100dvh] bg-canvas" />;
  }

  if (authState === 'login') {
    return (
      <LoginScreen
        onSuccess={() => {
          refreshCurrentUser();
          setAuthState('ready');
        }}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-canvas text-ink flex flex-col font-sans selection:bg-rec selection:text-white">
      
      {/* Top Navbar Header */}
      <Navbar
        aiTrainingCount={aiTrainingItems.length}
        onOpenAiTraining={() => setIsAiTrainingOpen(true)}
        projects={projects}
        onOpenProjects={() => setIsProjectsModalOpen(true)}
        customers={customers}
        onOpenCustomers={() => setIsCustomersModalOpen(true)}
        onSelectCustomer={handleSelectCustomer}
        onLoadExample={handleLoadExample}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      {/* Hero / Main Area */}
      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-10 py-8 space-y-5">

        <div className="pb-1">
          <h1 className="font-display text-[30px] sm:text-[34px] leading-tight text-ink">
            Nye scripts til Meta-annoncer
          </h1>
          <p className="text-[16.5px] text-muted mt-1">
            Udfyld de tre trin herunder. AI'en skriver hooks, body og CTA på baggrund af dem.
          </p>
        </div>

        {/* Script Configurator Form */}
        <ScriptForm
          key={JSON.stringify(formData)} // re-render when preset loaded
          initialData={formData}
          onSubmit={handleGenerateScripts}
          isLoading={isLoading}
          onSaveAsCustomer={handleSaveAsCustomer}
        />

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-rec-soft border border-rec/40 rounded-[var(--radius-card)] flex items-start gap-3 animate-fadeIn" role="alert">
            <AlertCircle className="w-5 h-5 text-rec shrink-0 mt-0.5" strokeWidth={1.75} aria-hidden="true" />
            <div>
              <span className="font-semibold block text-[16px] text-ink">Kunne ikke generere script</span>
              <p className="field-hint mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* GENERATED RESULTS SECTION */}
        {generatedScripts.length > 0 && (
          <div id="generated-results" className="space-y-6 pt-6 animate-fadeIn">
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 bg-surface border border-line rounded-[var(--radius-card)] p-5 shadow-[0_1px_2px_rgb(22_24_29/0.04)]">
              <div className="flex-1 min-w-0">
                <label htmlFor="documentTitle" className="field-label">
                  Dokumenttitel
                </label>
                <input
                  id="documentTitle"
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  placeholder="f.eks. JP Køl og Klima - Script 2"
                  className="control font-semibold"
                />
                <p className="field-hint mt-1.5">Vises øverst på eksporteret PDF og Docs.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => downloadScriptsAsDocx(generatedScripts, documentTitle)}
                  className={buttonStyles.ghost}
                  title="Download alle scripts som Google Docs (.docx), 1 script pr. side"
                >
                  <FileText className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                  Docs
                </button>

                <button
                  onClick={() => downloadScriptsAsPdf(generatedScripts, documentTitle)}
                  className={buttonStyles.ghost}
                  title="Download alle scripts som PDF, 1 script pr. side"
                >
                  <FileDown className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                  PDF
                </button>

                <button
                  onClick={() => {
                    const el = document.querySelector('form');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={buttonStyles.ghost}
                >
                  <RefreshCw className="w-4 h-4 text-muted" strokeWidth={1.75} aria-hidden="true" />
                  Nye parametre
                </button>

                <button
                  onClick={handleCopyAllScripts}
                  className={buttonStyles.secondary}
                  title="Kopiér alle scripts med Google Docs-formatering"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-4 h-4" strokeWidth={2} aria-hidden="true" />
                      Kopieret
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" strokeWidth={1.75} aria-hidden="true" />
                      Kopiér alle
                    </>
                  )}
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

      {/* Customers Modal */}
      <CustomersModal
        isOpen={isCustomersModalOpen}
        onClose={() => setIsCustomersModalOpen(false)}
        customers={customers}
        onRefreshCustomers={fetchCustomers}
        onSelectCustomer={handleSelectCustomer}
        showSharing={teamsEnabled}
      />

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
        showSharing={teamsEnabled}
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
        showSharing={teamsEnabled}
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
