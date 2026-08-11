import React, { useState } from 'react';
import { X, Users, Plus, Pencil, Trash2, FileText, ArrowRight, Share2 } from 'lucide-react';
import { Customer } from '../types';

interface CustomersModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onRefreshCustomers: () => void;
  onSelectCustomer: (customer: Customer) => void;
  showSharing?: boolean;
}

const EMPTY_FORM = {
  name: '',
  companyName: '',
  companyWebsite: '',
  productName: '',
  productDescription: '',
  targetAudience: '',
  demographics: '',
  offerOrCta: '',
  competitorsText: '',
  toneOfVoice: '',
  notes: '',
  shared: false
};

export const CustomersModal: React.FC<CustomersModalProps> = ({
  isOpen,
  onClose,
  customers,
  onRefreshCustomers,
  onSelectCustomer,
  showSharing = false
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const startCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setIsCreating(true);
  };

  const startEdit = (c: Customer) => {
    setForm({
      name: c.name || '',
      companyName: c.companyName || '',
      companyWebsite: c.companyWebsite || '',
      productName: c.productName || '',
      productDescription: c.productDescription || '',
      targetAudience: c.targetAudience || '',
      demographics: c.demographics || '',
      offerOrCta: c.offerOrCta || '',
      competitorsText: (c.competitors || []).join(', '),
      toneOfVoice: c.toneOfVoice || '',
      notes: c.notes || '',
      shared: !!c.shared
    });
    setEditingId(c.id);
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!form.companyName.trim() && !form.name.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        competitors: form.competitorsText.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3)
      };
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        onRefreshCustomers();
        setIsCreating(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
    } catch (err) {
      console.error('Fejl ved gem af kunde:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Slet denne kunde? Det kan ikke fortrydes.')) return;
    try {
      await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      onRefreshCustomers();
    } catch (err) {
      console.error('Fejl ved sletning af kunde:', err);
    }
  };

  const inputCls =
    'w-full bg-surface border border-line-strong focus:outline-none focus:ring-2 focus:ring-rec/20 focus:border-rec rounded-[var(--radius-control)] px-3 py-2.5 text-lg text-ink transition-all';
  const labelCls = 'block text-base font-bold text-ink mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-surface rounded-[var(--radius-control)] border border-line shadow-xl w-full max-w-3xl my-8">

        {/* Header */}
        <div className="px-6 py-4 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-rec" />
            <h2 className="text-2xl font-extrabold text-ink">Kunder</h2>
            <span className="text-lg text-muted">Gem kundeinfo én gang, genbrug til alle scripts</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-sunken rounded-[var(--radius-control)] cursor-pointer" title="Luk">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {!isCreating && (
            <>
              <button
                onClick={startCreate}
                className="w-full py-3 px-4 bg-rec hover:bg-rec-hover text-white rounded-[var(--radius-control)] text-lg font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Opret ny kunde</span>
              </button>

              {customers.length === 0 ? (
                <div className="text-center py-10 text-muted text-lg">
                  <p className="font-semibold text-muted mb-1">Ingen kunder endnu</p>
                  <p>Opret din første kunde, eller udfyld formularen og brug "Gem som kunde".</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      className="border border-line rounded-[var(--radius-control)] p-4 flex flex-wrap items-center justify-between gap-3 hover:border-line-strong transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-ink text-xl truncate">{c.name || c.companyName}</p>
                          {!showSharing ? null : c.shared ? (
                            <span className="inline-flex items-center gap-1 text-sm font-bold bg-sunken text-ink border border-line-strong px-2 py-0.5 rounded">
                              <Share2 className="w-3.5 h-3.5" /> Fælleskunde
                            </span>
                          ) : c.ownerLabel ? (
                            <span className="text-sm font-semibold bg-sunken text-muted border border-line px-2 py-0.5 rounded">
                              {c.ownerLabel}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-lg text-muted truncate">
                          {c.companyName}
                          {c.productName ? ` · ${c.productName}` : ''}
                        </p>
                        {c.analysisDocument?.extractedText && (
                          <p className="text-base text-ink flex items-center gap-1 mt-1">
                            <FileText className="w-4 h-4" />
                            Målgruppeanalyse gemt ({c.analysisDocument.name})
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(c)}
                          className="p-2.5 hover:bg-sunken border border-line rounded-[var(--radius-control)] cursor-pointer"
                          title="Redigér kunde"
                        >
                          <Pencil className="w-4 h-4 text-muted" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2.5 hover:bg-rec-soft border border-line rounded-[var(--radius-control)] cursor-pointer"
                          title="Slet kunde"
                        >
                          <Trash2 className="w-4 h-4 text-rec" />
                        </button>
                        <button
                          onClick={() => {
                            onSelectCustomer(c);
                            onClose();
                          }}
                          className="px-4 py-2.5 bg-ink hover:bg-black text-white rounded-[var(--radius-control)] text-lg font-bold flex items-center gap-2 cursor-pointer"
                          title="Udfyld formularen med denne kundes info"
                        >
                          <span>Brug kunde</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {isCreating && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Kundenavn (label i listen)</label>
                  <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="f.eks. JP Køl og Klima" />
                </div>
                <div>
                  <label className={labelCls}>Virksomhedsnavn *</label>
                  <input className={inputCls} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Virksomhedens officielle navn" />
                </div>
                <div>
                  <label className={labelCls}>Hjemmeside</label>
                  <input className={inputCls} value={form.companyWebsite} onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })} placeholder="https://..." />
                </div>
                <div>
                  <label className={labelCls}>Produktnavn</label>
                  <input className={inputCls} value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Produktbeskrivelse / USP</label>
                <textarea className={inputCls} rows={2} value={form.productDescription} onChange={(e) => setForm({ ...form, productDescription: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Målgruppe</label>
                  <textarea className={inputCls} rows={2} value={form.targetAudience} onChange={(e) => setForm({ ...form, targetAudience: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Geografi / demografi</label>
                  <textarea className={inputCls} rows={2} value={form.demographics} onChange={(e) => setForm({ ...form, demographics: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Tilbud / CTA</label>
                  <input className={inputCls} value={form.offerOrCta} onChange={(e) => setForm({ ...form, offerOrCta: e.target.value })} />
                </div>
                <div>
                  <label className={labelCls}>Konkurrenter (adskil med komma, maks 3)</label>
                  <input className={inputCls} value={form.competitorsText} onChange={(e) => setForm({ ...form, competitorsText: e.target.value })} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Tone of voice / talesprog</label>
                <input className={inputCls} value={form.toneOfVoice} onChange={(e) => setForm({ ...form, toneOfVoice: e.target.value })} placeholder="f.eks. Afslappet dansk talesprog, som en god ven der anbefaler" />
              </div>
              <div>
                <label className={labelCls}>Interne noter</label>
                <textarea className={inputCls} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>

              {showSharing && (
              <label className="flex items-start gap-3 p-3.5 border border-line-strong rounded-[var(--radius-control)] cursor-pointer hover:bg-sunken transition-colors">
                <input
                  type="checkbox"
                  checked={form.shared}
                  onChange={(e) => setForm({ ...form, shared: e.target.checked })}
                  className="mt-1 w-4 h-4 accent-rec cursor-pointer"
                />
                <span className="text-base text-ink">
                  <span className="font-semibold text-ink block">Fælleskunde</span>
                  Sæt flueben, hvis begge virksomheder arbejder på denne kunde. Uden flueben er kunden kun synlig for din egen virksomhed.
                </span>
              </label>
              )}

              <p className="text-base text-muted">
                Tip: Målgruppeanalysen (PDF/Word) gemmes automatisk på kunden, når du bruger "Gem som kunde" fra formularen efter at have uploadet den.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving || (!form.companyName.trim() && !form.name.trim())}
                  className="px-5 py-2.5 bg-rec hover:bg-rec-hover text-white rounded-[var(--radius-control)] text-lg font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Gemmer...' : editingId ? 'Gem ændringer' : 'Opret kunde'}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setEditingId(null);
                  }}
                  className="px-5 py-2.5 bg-surface hover:bg-sunken border border-line-strong text-ink rounded-[var(--radius-control)] text-lg font-semibold cursor-pointer"
                >
                  Annullér
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
