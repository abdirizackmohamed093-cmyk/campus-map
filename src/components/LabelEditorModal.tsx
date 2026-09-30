import React, { useState } from 'react';
import { CampusLocation, LocationType } from '../types/campus';
import {
  AlertTriangle,
  Check,
  Download,
  Edit3,
  RotateCcw,
  Search,
  X,
  MapPin,
} from 'lucide-react';

interface LabelEditorModalProps {
  isOpen: boolean;
  locations: CampusLocation[];
  onClose: () => void;
  onUpdateLocation: (updated: CampusLocation) => void;
  onResetLocations: () => void;
  onFocusLocation: (loc: CampusLocation) => void;
}

const LOCATION_TYPES: LocationType[] = [
  'classroom',
  'laboratory',
  'workshop',
  'office',
  'toilet',
  'field',
  'mosque',
  'hall',
  'kitchen',
  'entrance',
  'exit',
  'landmark',
  'other',
];

export const LabelEditorModal: React.FC<LabelEditorModalProps> = ({
  isOpen,
  locations,
  onClose,
  onUpdateLocation,
  onResetLocations,
  onFocusLocation,
}) => {
  const [filterMode, setFilterMode] = useState<'unconfirmed' | 'all'>('unconfirmed');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftShortLabel, setDraftShortLabel] = useState('');
  const [draftType, setDraftType] = useState<LocationType>('classroom');
  const [draftConfirmed, setDraftConfirmed] = useState(true);

  if (!isOpen) return null;

  const unconfirmedCount = locations.filter((l) => l.unconfirmed).length;

  const filteredLocations = locations.filter((loc) => {
    if (filterMode === 'unconfirmed' && !loc.unconfirmed) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.id.toLowerCase().includes(q) ||
      loc.building.toLowerCase().includes(q) ||
      (loc.visualReading && loc.visualReading.toLowerCase().includes(q))
    );
  });

  const startEditing = (loc: CampusLocation) => {
    setEditingId(loc.id);
    setDraftName(loc.name.replace(/^UNCONFIRMED:\s*/i, ''));
    setDraftShortLabel(loc.shortLabel || loc.name.replace(/^UNCONFIRMED:\s*/i, ''));
    setDraftType(loc.type);
    setDraftConfirmed(true);
  };

  const saveEdit = (loc: CampusLocation) => {
    const cleanName = draftName.trim() || loc.name;
    const finalName = draftConfirmed
      ? cleanName.replace(/^UNCONFIRMED:\s*/i, '')
      : cleanName.startsWith('UNCONFIRMED:')
      ? cleanName
      : `UNCONFIRMED: ${cleanName}`;

    onUpdateLocation({
      ...loc,
      name: finalName,
      shortLabel: draftShortLabel.trim() || cleanName.slice(0, 18),
      type: draftType,
      unconfirmed: !draftConfirmed,
    });
    setEditingId(null);
  };

  const handleDownloadLocationsJson = () => {
    const blob = new Blob([JSON.stringify(locations, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'locations.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Source PDF Digitization Audit & Label Editor
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Review unclear or unlabeled compartments from Page 1 & Page 2 of the hand-drawn map and update their names.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterMode('unconfirmed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filterMode === 'unconfirmed'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Unconfirmed Labels ({unconfirmedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                filterMode === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Digitized Locations ({locations.length})
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-xs">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by reading, ID, or block..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onResetLocations}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadLocationsJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export locations.json</span>
            </button>
          </div>
        </div>

        {/* List Body */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 px-6 py-2">
          {filteredLocations.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              No locations match your current filter.
            </div>
          ) : (
            filteredLocations.map((loc) => {
              const isEditing = editingId === loc.id;
              return (
                <div key={loc.id} className="py-3.5 flex flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {loc.unconfirmed && (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <span className="text-sm font-bold text-slate-900">
                          {loc.name}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-xs font-mono text-slate-500">
                          ID: {loc.id}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                        <span>Page {loc.sheet}</span>
                        <span>·</span>
                        <span>{loc.building}</span>
                        <span>·</span>
                        <span>Type: {loc.type}</span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          ({loc.x}, {loc.y})
                        </span>
                      </div>
                      {(loc.visualReading || loc.verificationNote) && (
                        <p className="text-xs text-amber-800 bg-amber-50/80 border border-amber-200/70 rounded-lg px-2.5 py-1.5 mt-1">
                          <strong>Source Map Note:</strong>{' '}
                          {loc.visualReading ? `Best visual reading: "${loc.visualReading}". ` : ''}
                          {loc.verificationNote}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          onFocusLocation(loc);
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>View on Map</span>
                      </button>
                      {!isEditing && (
                        <button
                          type="button"
                          onClick={() => startEditing(loc)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Label</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Full Location Name
                        </label>
                        <input
                          type="text"
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Map Short Label
                        </label>
                        <input
                          type="text"
                          value={draftShortLabel}
                          onChange={(e) => setDraftShortLabel(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Category Type
                        </label>
                        <select
                          value={draftType}
                          onChange={(e) => setDraftType(e.target.value as LocationType)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                        >
                          {LOCATION_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-4 flex items-center justify-between pt-1">
                        <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={draftConfirmed}
                            onChange={(e) => setDraftConfirmed(e.target.checked)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span>Mark label as verified (removes UNCONFIRMED prefix)</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(loc)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Change</span>
                          </button>
                        </div>
                      </div>
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
