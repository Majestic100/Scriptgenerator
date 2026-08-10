import React, { useState } from 'react';
import { 
  X, 
  Folder, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Video, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Loader2, 
  FolderCheck,
  ExternalLink,
  Film,
  Clock,
  Sparkles
} from 'lucide-react';
import { GeneratedScript, Project } from '../types';
import { formatScriptToHtml, formatScriptToPlainText, copyFormattedToClipboard } from '../utils/formatUtils';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onRefreshProjects: () => Promise<void> | void;
  onOpenTeleprompter: (script: GeneratedScript) => void;
  onSelectScript: (script: GeneratedScript) => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  onRefreshProjects,
  onOpenTeleprompter,
  onSelectScript,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingScriptInfo, setDeletingScriptInfo] = useState<{ projId: string; scriptId: string } | null>(null);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      p.scripts?.some((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameInput.trim(),
          description: descInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNameInput('');
        setDescInput('');
        setIsCreating(false);
        await onRefreshProjects();
        if (data.project?.id) {
          setExpandedProjectId(data.project.id);
        }
      }
    } catch (err) {
      console.error('Fejl ved oprettelse af projekt:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProject = async (projectId: string) => {
    if (!editName.trim()) return;
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDesc.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingProjectId(null);
        await onRefreshProjects();
      }
    } catch (err) {
      console.error('Fejl ved opdatering af projekt:', err);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm('Er du sikker på, at du vil slette dette projekt og alle dets gemte scripts?')) {
      return;
    }
    setDeletingId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await onRefreshProjects();
        if (expandedProjectId === projectId) {
          setExpandedProjectId(null);
        }
      }
    } catch (err) {
      console.error('Fejl ved sletning af projekt:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveScriptFromProject = async (projectId: string, scriptId: string) => {
    setDeletingScriptInfo({ projId: projectId, scriptId });
    try {
      const res = await fetch(`/api/projects/${projectId}/scripts/${scriptId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await onRefreshProjects();
      }
    } catch (err) {
      console.error('Fejl ved fjernelse af script fra projekt:', err);
    } finally {
      setDeletingScriptInfo(null);
    }
  };

  const handleCopyScript = async (script: GeneratedScript, idx: number) => {
    const htmlContent = formatScriptToHtml(script, idx);
    const plainTextContent = formatScriptToPlainText(script, idx);
    await copyFormattedToClipboard(htmlContent, plainTextContent);
    setCopiedScriptId(script.id);
    setTimeout(() => setCopiedScriptId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] text-slate-800">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-50 text-[#E52328] rounded-xl border border-red-100">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-lg text-[#181E2B]">Projekter</h2>
                <span className="text-sm bg-red-100 text-[#E52328] font-extrabold px-2 py-0.5 rounded-full">
                  {projects.length}
                </span>
              </div>
              <p className="text-sm text-slate-500">
                Gem og organiser scripts i fælles projekter. Gemmes automatisk til alle brugere.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-3.5 py-2 bg-[#E52328] hover:bg-[#c81e22] text-white rounded-xl text-sm font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nyt Projekt</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Create Project Panel */}
        {isCreating && (
          <div className="p-4 bg-red-50/50 border-b border-red-100 animate-fadeIn">
            <form onSubmit={handleCreateProject} className="space-y-3 max-w-xl mx-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#E52328] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  Opret et nyt projekt
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-sm text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Annuller
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Projektnavn *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="f.eks. Kampagne Q3, Skønhed & Hudpleje"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Beskrivelse (Valgfri)
                  </label>
                  <input
                    type="text"
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder="f.eks. Vinkel-tests for C-Vitamin serum"
                    className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328] focus:ring-1 focus:ring-[#E52328]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !nameInput.trim()}
                  className="px-4 py-2 bg-[#E52328] text-white rounded-lg text-sm font-bold hover:bg-[#c81e22] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Gemmer projekt...</span>
                    </>
                  ) : (
                    <>
                      <FolderCheck className="w-4 h-4" />
                      <span>Gem Projekt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/50">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Søg i projekter eller scripts..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-[#E52328]"
            />
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-3">
              <Folder className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-medium text-slate-600">
                {searchTerm
                  ? 'Ingen projekter matcher din søgning.'
                  : 'Du har ingen oprettede projekter endnu. Klik på "Nyt Projekt" for at komme i gang!'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-[#E52328] text-white rounded-lg text-sm font-bold hover:bg-[#c81e22] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Opret dit første projekt</span>
                </button>
              )}
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const isExpanded = expandedProjectId === proj.id;
              const isEditing = editingProjectId === proj.id;
              const isDeleting = deletingId === proj.id;
              const scriptCount = proj.scripts?.length || 0;

              return (
                <div
                  key={proj.id}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all hover:border-slate-300"
                >
                  {/* Project Item Header */}
                  <div className="p-4 flex items-center justify-between gap-3 bg-slate-50/60 hover:bg-slate-50">
                    
                    {!isEditing ? (
                      <div
                        onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                        className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                      >
                        <div className="p-2 bg-red-50 text-[#E52328] rounded-lg border border-red-100 shrink-0 mt-0.5">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-base text-[#181E2B] truncate">
                              {proj.name}
                            </h3>
                            <span className="text-xs bg-white border border-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                              {scriptCount} {scriptCount === 1 ? 'script' : 'scripts'}
                            </span>
                          </div>
                          {proj.description && (
                            <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">
                              {proj.description}
                            </p>
                          )}
                          <span className="text-xs text-slate-400 block mt-1">
                            Opdateret {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Projektnavn"
                          className="bg-white border border-slate-300 rounded-md p-1.5 text-sm font-bold outline-none focus:border-[#E52328]"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Beskrivelse"
                            className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-sm outline-none focus:border-[#E52328]"
                          />
                          <button
                            onClick={() => handleUpdateProject(proj.id)}
                            className="px-2.5 py-1.5 bg-[#E52328] text-white rounded text-sm font-bold shrink-0"
                          >
                            Gem
                          </button>
                          <button
                            onClick={() => setEditingProjectId(null)}
                            className="px-2.5 py-1.5 bg-slate-200 text-slate-700 rounded text-sm shrink-0"
                          >
                            X
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!isEditing && (
                        <button
                          onClick={() => {
                            setEditingProjectId(proj.id);
                            setEditName(proj.name);
                            setEditDesc(proj.description || '');
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Rediger projekt"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        disabled={isDeleting}
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
                        title="Slet projekt"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                        className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                  </div>

                  {/* Expanded Scripts inside Project */}
                  {isExpanded && (
                    <div className="p-4 border-t border-slate-200 bg-slate-100/50 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                        <span>Gemte scripts i dette projekt ({scriptCount})</span>
                      </div>

                      {scriptCount === 0 ? (
                        <div className="p-6 text-center bg-white rounded-lg border border-dashed border-slate-200 text-slate-400 text-sm">
                          Der er endnu ingen scripts gemt i dette projekt. Når du genererer et script, kan du klikke "Gem til Projekt".
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {proj.scripts.map((script, scriptIdx) => {
                            const isDeletingScript =
                              deletingScriptInfo?.projId === proj.id && deletingScriptInfo?.scriptId === script.id;

                            return (
                              <div
                                key={script.id}
                                className="p-4 bg-white border border-slate-200 rounded-lg shadow-2xs space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <span className="text-xs font-bold text-[#E52328] uppercase tracking-wider block">
                                      {script.companyName}
                                    </span>
                                    <h4 className="text-base font-bold text-[#181E2B]">
                                      {script.title}
                                    </h4>
                                  </div>

                                  <button
                                    disabled={isDeletingScript}
                                    onClick={() => handleRemoveScriptFromProject(proj.id, script.id)}
                                    className="text-slate-400 hover:text-red-600 p-1 transition-colors cursor-pointer disabled:opacity-50"
                                    title="Fjern script fra projekt"
                                  >
                                    {isDeletingScript ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-red-600" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-slate-600 flex-wrap">
                                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs">
                                    <Film className="w-3 h-3 text-[#E52328]" />
                                    {script.scriptType}
                                  </span>
                                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-xs">
                                    <Clock className="w-3 h-3 text-emerald-600" />
                                    {script.bodyDuration}
                                  </span>
                                  {script.hooks?.length > 0 && (
                                    <span className="text-xs text-slate-500">
                                      {script.hooks.length} Hooks
                                    </span>
                                  )}
                                </div>

                                <div className="pt-2.5 flex items-center justify-between gap-2 border-t border-slate-100 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        onSelectScript(script);
                                        onClose();
                                      }}
                                      className="text-sm text-[#E52328] hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded border border-red-200 transition-colors"
                                    >
                                      <span>Vis Script</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        onOpenTeleprompter(script);
                                        onClose();
                                      }}
                                      className="text-sm text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded border border-indigo-200 transition-colors"
                                    >
                                      <Video className="w-3.5 h-3.5" />
                                      <span>Teleprompter Mode</span>
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => handleCopyScript(script, scriptIdx)}
                                    className="text-sm text-slate-700 hover:text-slate-900 flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-200 cursor-pointer"
                                  >
                                    {copiedScriptId === script.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                                        <span className="text-emerald-700 font-bold">Kopieret!</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                                        <span>Kopiér Script</span>
                                      </>
                                    )}
                                  </button>
                                </div>

                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
