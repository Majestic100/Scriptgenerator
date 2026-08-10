import React, { useState } from 'react';
import { X, FolderPlus, Folder, Plus, Check, Loader2, Sparkles } from 'lucide-react';
import { GeneratedScript, Project } from '../types';

interface SaveToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  script: GeneratedScript | null;
  projects: Project[];
  onRefreshProjects: () => Promise<void> | void;
}

export const SaveToProjectModal: React.FC<SaveToProjectModalProps> = ({
  isOpen,
  onClose,
  script,
  projects,
  onRefreshProjects,
}) => {
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [successProjectId, setSuccessProjectId] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !script) return null;

  const handleSaveToProject = async (projectId: string) => {
    setLoadingProjectId(projectId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/scripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessProjectId(projectId);
        await onRefreshProjects();
        setTimeout(() => {
          setSuccessProjectId(null);
          setLoadingProjectId(null);
          onClose();
        }, 1200);
      } else {
        setErrorMsg(data.error || 'Fejl ved gemning af script til projekt.');
        setLoadingProjectId(null);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Netværksfejl ved gemning af script.');
      setLoadingProjectId(null);
    }
  };

  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreatingProject(true);
    setErrorMsg(null);
    try {
      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDesc.trim(),
        }),
      });
      const createData = await createRes.json();
      if (createData.success && createData.project) {
        // Now save script into this new project
        await handleSaveToProject(createData.project.id);
        setNewProjectName('');
        setNewProjectDesc('');
        setIsCreatingNew(false);
      } else {
        setErrorMsg(createData.error || 'Fejl ved oprettelse af projekt.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Kunne ikke oprette projekt.');
    } finally {
      setIsCreatingProject(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-800">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-50 text-[#E52328] rounded-lg border border-red-100">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#181E2B]">Gem til Projekt</h3>
              <p className="text-base text-slate-500 line-clamp-1">
                "{script.title || script.companyName}"
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-base font-medium">
              {errorMsg}
            </div>
          )}

          {!isCreatingNew ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-slate-600 uppercase tracking-wider">
                  Vælg et eksisterende projekt
                </span>
                <button
                  onClick={() => setIsCreatingNew(true)}
                  className="text-base text-[#E52328] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nyt Projekt</span>
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
                  <Folder className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-base text-slate-600">
                    Du har ingen oprettede projekter endnu. Opret dit første projekt herunder!
                  </p>
                  <button
                    onClick={() => setIsCreatingNew(true)}
                    className="px-4 py-2 bg-[#E52328] text-white rounded-lg text-base font-bold hover:bg-[#c81e22] transition-all flex items-center gap-1.5 mx-auto cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Opret Nyt Projekt</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {projects.map((proj) => {
                    const isAlreadyIn = proj.scripts?.some((s) => s.id === script.id);
                    const isLoading = loadingProjectId === proj.id;
                    const isSuccess = successProjectId === proj.id;

                    return (
                      <button
                        key={proj.id}
                        disabled={isLoading || isSuccess}
                        onClick={() => handleSaveToProject(proj.id)}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                          isSuccess
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-[#E52328]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-lg ${isSuccess ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            <Folder className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-bold text-[#181E2B] truncate">
                                {proj.name}
                              </h4>
                              {isAlreadyIn && (
                                <span className="text-sm bg-amber-50 text-amber-700 font-semibold px-1.5 py-0.2 rounded border border-amber-200">
                                  Indeholder script
                                </span>
                              )}
                            </div>
                            {proj.description && (
                              <p className="text-sm text-slate-500 truncate mt-0.5">
                                {proj.description}
                              </p>
                            )}
                            <span className="text-sm text-slate-400 block mt-0.5">
                              {proj.scripts?.length || 0} scripts gemt
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#E52328]" />
                          ) : isSuccess ? (
                            <div className="flex items-center gap-1 text-base font-bold text-emerald-600">
                              <Check className="w-4 h-4" />
                              <span>Gemt!</span>
                            </div>
                          ) : (
                            <span className="text-base font-bold text-[#E52328] hover:underline">
                              {isAlreadyIn ? 'Opdatér' : 'Gem hér'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateAndSave} className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-bold text-slate-800 uppercase tracking-wider">
                  Opret nyt projekt & gem script
                </h4>
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-base text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Annuller
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-base font-semibold text-slate-700">
                  Projektnavn *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="f.eks. Sommer Kampagne 2026, Q3 Meta Ads, Bodyscrub Launch"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-base text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-base font-semibold text-slate-700">
                  Beskrivelse (valgfri)
                </label>
                <textarea
                  rows={2}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="f.eks. Vinkel-test af C-vitamin serum til kvinder 25-45 år"
                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-base text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328]"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingProject || !newProjectName.trim()}
                className="w-full mt-2 py-2.5 bg-[#E52328] hover:bg-[#c81e22] text-white rounded-lg text-base font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isCreatingProject ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Opretter og gemmer...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Opret Projekt & Gem Script</span>
                  </>
                )}
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
