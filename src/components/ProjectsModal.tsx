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
import { useLang, formatDuration, dateLocale } from '../i18n';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onRefreshProjects: () => Promise<void> | void;
  onOpenTeleprompter: (script: GeneratedScript) => void;
  onSelectScript: (script: GeneratedScript) => void;
  showSharing?: boolean;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  onRefreshProjects,
  onOpenTeleprompter,
  onSelectScript,
  showSharing = false,
}) => {
  const { t, lang } = useLang();
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

  const [sharedInput, setSharedInput] = useState(false);

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
          shared: sharedInput,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNameInput('');
        setDescInput('');
        setSharedInput(false);
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
    if (!window.confirm(t.projectsM.confirmDelete)) {
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
    <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-3xl bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] text-ink">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-sunken">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rec-soft text-rec rounded-[var(--radius-card)] border border-rec/30">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-xl text-ink">{t.projectsM.title}</h2>
                <span className="text-base bg-rec-soft text-rec font-extrabold px-2 py-0.5 rounded-full">
                  {projects.length}
                </span>
              </div>
              <p className="text-base text-muted">
                {t.projectsM.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-3.5 py-2 bg-rec hover:bg-rec-hover text-white rounded-[var(--radius-card)] text-base font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.projectsM.newProject}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-[var(--radius-card)] text-muted hover:text-ink bg-surface hover:bg-sunken border border-line transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Create Project Panel */}
        {isCreating && (
          <div className="p-4 bg-rec-soft border-b border-rec/30 animate-fadeIn">
            <form onSubmit={handleCreateProject} className="space-y-3 max-w-xl mx-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-rec uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {t.projectsM.createHeader}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-base text-muted hover:text-ink font-semibold"
                >
                  {t.projectsM.cancel}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-bold text-ink block mb-1">
                    {t.projectsM.nameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder={t.projectsM.namePlaceholder}
                    className="w-full bg-surface border border-line rounded-[var(--radius-control)] p-2.5 text-base text-ink placeholder-slate-400 outline-none focus:border-rec focus:ring-1 focus:ring-rec"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold text-ink block mb-1">
                    {t.projectsM.descLabel}
                  </label>
                  <input
                    type="text"
                    value={descInput}
                    onChange={(e) => setDescInput(e.target.value)}
                    placeholder={t.projectsM.descPlaceholder}
                    className="w-full bg-surface border border-line rounded-[var(--radius-control)] p-2.5 text-base text-ink placeholder-slate-400 outline-none focus:border-rec focus:ring-1 focus:ring-rec"
                  />
                </div>

                {showSharing && (
                <div className="sm:col-span-2">
                  <label className="flex items-start gap-3 p-3 bg-surface border border-line rounded-[var(--radius-control)] cursor-pointer hover:border-line-strong transition-colors">
                    <input
                      type="checkbox"
                      checked={sharedInput}
                      onChange={(e) => setSharedInput(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-rec cursor-pointer"
                    />
                    <span className="text-base text-ink">
                      <span className="font-semibold text-ink block">{t.projectsM.sharedTitle}</span>
                      {t.projectsM.sharedDesc}
                    </span>
                  </label>
                </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !nameInput.trim()}
                  className="px-4 py-2 bg-rec text-white rounded-[var(--radius-control)] text-base font-bold hover:bg-rec-hover transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t.projectsM.savingProject}</span>
                    </>
                  ) : (
                    <>
                      <FolderCheck className="w-4 h-4" />
                      <span>{t.projectsM.saveProject}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-3.5 border-b border-line bg-sunken">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.projectsM.searchPlaceholder}
              className="w-full bg-surface border border-line rounded-[var(--radius-control)] pl-9 pr-3 py-2 text-base text-ink placeholder-slate-400 outline-none focus:border-rec"
            />
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-16 text-muted space-y-3">
              <Folder className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-base font-medium text-muted">
                {searchTerm
                  ? t.projectsM.emptySearch
                  : t.projectsM.emptyNone}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 bg-rec text-white rounded-[var(--radius-control)] text-base font-bold hover:bg-rec-hover transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.projectsM.createFirst}</span>
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
                  className="bg-surface border border-line rounded-[var(--radius-card)] overflow-hidden shadow-none transition-all hover:border-line-strong"
                >
                  {/* Project Item Header */}
                  <div className="p-4 flex items-center justify-between gap-3 bg-sunken hover:bg-sunken">
                    
                    {!isEditing ? (
                      <div
                        onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                        className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                      >
                        <div className="p-2 bg-rec-soft text-rec rounded-[var(--radius-control)] border border-rec/30 shrink-0 mt-0.5">
                          <Folder className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-lg text-ink truncate">
                              {proj.name}
                            </h3>
                            <span className="text-sm bg-surface border border-line text-ink font-bold px-2 py-0.5 rounded-full">
                              {t.projectsM.scriptsBadge(scriptCount)}
                            </span>
                          </div>
                          {proj.description && (
                            <p className="text-base text-muted line-clamp-1 mt-0.5">
                              {proj.description}
                            </p>
                          )}
                          <span className="text-sm text-muted block mt-1">
                            {t.projectsM.updated} {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString(dateLocale(lang), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 pr-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder={t.projectsM.editNamePlaceholder}
                          className="bg-surface border border-line-strong rounded-[var(--radius-control)] p-1.5 text-base font-bold outline-none focus:border-rec"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder={t.projectsM.editDescPlaceholder}
                            className="w-full bg-surface border border-line-strong rounded-[var(--radius-control)] p-1.5 text-base outline-none focus:border-rec"
                          />
                          <button
                            onClick={() => handleUpdateProject(proj.id)}
                            className="px-2.5 py-1.5 bg-rec text-white rounded text-base font-bold shrink-0"
                          >
                            {t.projectsM.save}
                          </button>
                          <button
                            onClick={() => setEditingProjectId(null)}
                            className="px-2.5 py-1.5 bg-line text-ink rounded text-base shrink-0"
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
                          className="p-1.5 rounded text-muted hover:text-ink hover:bg-line transition-colors cursor-pointer"
                          title={t.projectsM.editTitle}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        disabled={isDeleting}
                        onClick={() => handleDeleteProject(proj.id)}
                        className="p-1.5 rounded text-muted hover:text-rec hover:bg-rec-soft transition-colors cursor-pointer disabled:opacity-50"
                        title={t.projectsM.deleteTitle}
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rec" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => setExpandedProjectId(isExpanded ? null : proj.id)}
                        className="p-1.5 rounded text-muted hover:text-ink hover:bg-line transition-colors cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>

                  </div>

                  {/* Expanded Scripts inside Project */}
                  {isExpanded && (
                    <div className="p-4 border-t border-line bg-sunken/50 space-y-3 animate-fadeIn">
                      <div className="flex items-center justify-between text-base font-bold text-ink">
                        <span>{t.projectsM.scriptsInProject(scriptCount)}</span>
                      </div>

                      {scriptCount === 0 ? (
                        <div className="p-6 text-center bg-surface rounded-[var(--radius-control)] border border-dashed border-line text-muted text-base">
                          {t.projectsM.noScriptsInProject}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {proj.scripts.map((script, scriptIdx) => {
                            const isDeletingScript =
                              deletingScriptInfo?.projId === proj.id && deletingScriptInfo?.scriptId === script.id;

                            return (
                              <div
                                key={script.id}
                                className="p-4 bg-surface border border-line rounded-[var(--radius-control)] shadow-none space-y-2.5"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <span className="text-sm font-bold text-rec uppercase tracking-wider block">
                                      {script.companyName}
                                    </span>
                                    <h4 className="text-lg font-bold text-ink">
                                      {script.title}
                                    </h4>
                                  </div>

                                  <button
                                    disabled={isDeletingScript}
                                    onClick={() => handleRemoveScriptFromProject(proj.id, script.id)}
                                    className="text-muted hover:text-rec p-1 transition-colors cursor-pointer disabled:opacity-50"
                                    title={t.projectsM.removeScript}
                                  >
                                    {isDeletingScript ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-rec" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>

                                <div className="flex items-center gap-2 text-base text-muted flex-wrap">
                                  <span className="flex items-center gap-1 bg-sunken px-2 py-0.5 rounded border border-line text-sm">
                                    <Film className="w-3 h-3 text-rec" />
                                    {script.scriptType}
                                  </span>
                                  <span className="flex items-center gap-1 bg-sunken px-2 py-0.5 rounded border border-line text-sm">
                                    <Clock className="w-3 h-3 text-ink" />
                                    {formatDuration(script.bodyDuration, lang)}
                                  </span>
                                  {script.hooks?.length > 0 && (
                                    <span className="text-sm text-muted">
                                      {script.hooks.length} {t.projectsM.hooksWord}
                                    </span>
                                  )}
                                </div>

                                <div className="pt-2.5 flex items-center justify-between gap-2 border-t border-line flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        onSelectScript(script);
                                        onClose();
                                      }}
                                      className="text-base text-rec hover:text-red-800 font-bold flex items-center gap-1 cursor-pointer bg-rec-soft hover:bg-rec-soft px-2.5 py-1 rounded border border-rec/30 transition-colors"
                                    >
                                      <span>{t.projectsM.viewScript}</span>
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        onOpenTeleprompter(script);
                                        onClose();
                                      }}
                                      className="text-base text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded border border-indigo-200 transition-colors"
                                    >
                                      <Video className="w-3.5 h-3.5" />
                                      <span>{t.projectsM.teleprompter}</span>
                                    </button>
                                  </div>

                                  <button
                                    onClick={() => handleCopyScript(script, scriptIdx)}
                                    className="text-base text-ink hover:text-ink flex items-center gap-1 bg-sunken hover:bg-sunken px-2.5 py-1 rounded border border-line cursor-pointer"
                                  >
                                    {copiedScriptId === script.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-ink" />
                                        <span className="text-ink font-bold">{t.projectsM.copied}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5 text-muted" />
                                        <span>{t.projectsM.copyScript}</span>
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
