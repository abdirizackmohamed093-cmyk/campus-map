import React, { useEffect, useMemo, useState } from 'react';
import initialLocationsData from './data/locations.json';
import routeNodesData from './data/routeNodes.json';
import routeConnectionsData from './data/routeConnections.json';
import buildingsData from './data/buildings.json';
import {
  BuildingShell,
  CalculatedRoute,
  CampusLocation,
  LocationType,
  RouteConnection,
  RouteNode,
  RouteResult,
} from './types/campus';
import {
  calculateApprovedRedRoute,
  snapTapToApprovedRedNode,
} from './navigation/dijkstra';
import { CampusMap } from './map/CampusMap';
import { LabelEditorModal } from './components/LabelEditorModal';
import { downloadProjectZip } from './utils/exportZip';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Download,
  Edit3,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';

const STORAGE_KEY = 'campus_vector_locations_v2';

const CATEGORY_FILTERS: { id: LocationType | 'all' | 'unconfirmed'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'classroom', label: 'Classrooms' },
  { id: 'laboratory', label: 'Labs' },
  { id: 'workshop', label: 'Workshops' },
  { id: 'office', label: 'Offices' },
  { id: 'toilet', label: 'Toilets' },
  { id: 'landmark', label: 'Landmarks' },
  { id: 'unconfirmed', label: 'Unconfirmed' },
];

const QUICK_SEARCH_EXAMPLES = [
  { label: 'H5', id: 'h5' },
  { label: 'H4', id: 'h4' },
  { label: 'ICT Lab 1', id: 'ict-lab-1' },
  { label: 'Masonry', id: 'masonry' },
  { label: 'Mosque', id: 'mosque' },
  { label: 'Carpentry', id: 'carpentry-and-workshop' },
  { label: 'Entrance', id: 'entrance' },
];

export default function App() {
  // Load locations from localStorage if user edited any unconfirmed labels previously
  const [locations, setLocations] = useState<CampusLocation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return initialLocationsData as CampusLocation[];
  });

  const routeNodes = routeNodesData as RouteNode[];
  const routeConnections = routeConnectionsData as RouteConnection[];
  const buildings = buildingsData as BuildingShell[];

  // Navigation & Map states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<LocationType | 'all' | 'unconfirmed'>('all');
  const [sheetView, setSheetView] = useState<'all' | 1 | 2>('all');

  // Default current location: H4, Default destination: H5 (demonstrates going around H6 via the red route!)
  const [startPoint, setStartPoint] = useState<
    | { type: 'location'; locationId: string }
    | { type: 'node'; nodeId: string; label?: string }
    | null
  >({ type: 'location', locationId: 'h4' });

  const [selectedLocationId, setSelectedLocationId] = useState<string | null>('h5');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [isNavigationActive, setIsNavigationActive] = useState<boolean>(true);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [isSettingLocation, setIsSettingLocation] = useState<boolean>(false);
  const [showGraphOverlay, setShowGraphOverlay] = useState<boolean>(false);
  const [highlightUnconfirmed, setHighlightUnconfirmed] = useState<boolean>(true);
  const [isLabelEditorOpen, setIsLabelEditorOpen] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [isMobilePanelExpanded, setIsMobilePanelExpanded] = useState<boolean>(true);

  const [focusTarget, setFocusTarget] = useState<{
    x: number;
    y: number;
    zoom?: number;
    timestamp: number;
  } | null>(null);

  // Quick inline rename state for selected unconfirmed room
  const [isInlineRenaming, setIsInlineRenaming] = useState<boolean>(false);
  const [inlineNameDraft, setInlineNameDraft] = useState<string>('');

  // Persist location edits to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
    } catch {
      // ignore
    }
  }, [locations]);

  const selectedLocation = useMemo(
    () => locations.find((l) => l.id === selectedLocationId) || null,
    [locations, selectedLocationId]
  );

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b.id === selectedBuildingId) || null,
    [buildings, selectedBuildingId]
  );

  const buildingRooms = useMemo(() => {
    if (!selectedBuilding) return [];
    return locations.filter(
      (loc) =>
        loc.sheet === selectedBuilding.sheet &&
        loc.x + loc.width / 2 >= selectedBuilding.x - 15 &&
        loc.x + loc.width / 2 <= selectedBuilding.x + selectedBuilding.width + 15 &&
        loc.y + loc.height / 2 >= selectedBuilding.y - 15 &&
        loc.y + loc.height / 2 <= selectedBuilding.y + selectedBuilding.height + 15
    );
  }, [selectedBuilding, locations]);

  const unconfirmedLocations = useMemo(
    () => locations.filter((l) => l.unconfirmed),
    [locations]
  );

  // Search filtering
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return locations
      .filter(
        (loc) =>
          loc.name.toLowerCase().includes(q) ||
          (loc.shortLabel && loc.shortLabel.toLowerCase().includes(q)) ||
          loc.type.toLowerCase().includes(q) ||
          loc.building.toLowerCase().includes(q) ||
          loc.id.toLowerCase().includes(q)
      )
      .slice(0, 14);
  }, [locations, searchQuery]);

  // Calculate & validate route exclusively on the Approved Red Route Network
  const routeResult: RouteResult | null = useMemo(() => {
    if (!isNavigationActive || !startPoint || !selectedLocationId) return null;
    return calculateApprovedRedRoute(
      startPoint,
      selectedLocationId,
      locations,
      routeNodes,
      routeConnections
    );
  }, [isNavigationActive, startPoint, selectedLocationId, locations, routeNodes, routeConnections]);

  const activeRoute: CalculatedRoute | null =
    routeResult && routeResult.status === 'ok' ? routeResult.route : null;

  // Handlers
  const handleSelectLocation = (loc: CampusLocation, shouldZoom = false) => {
    if (isSettingLocation) {
      if (loc.connections && loc.connections.length > 0) {
        setStartPoint({ type: 'location', locationId: loc.id });
      } else {
        const snapped = snapTapToApprovedRedNode(
          loc.x + loc.width / 2,
          loc.y + loc.height / 2,
          loc.sheet,
          routeNodes
        );
        setStartPoint({
          type: 'node',
          nodeId: snapped.id,
          label: `Red Route: ${snapped.name}`,
        });
      }
      setIsSettingLocation(false);
      setActiveStepIndex(null);
      return;
    }

    setSelectedLocationId(loc.id);
    setSelectedBuildingId(null);
    setIsInlineRenaming(false);
    setActiveStepIndex(null);
    setIsMobilePanelExpanded(true);

    if (sheetView !== 'all' && sheetView !== loc.sheet) {
      setSheetView('all');
    }

    if (shouldZoom) {
      setFocusTarget({
        x: loc.x + loc.width / 2,
        y: loc.y + loc.height / 2,
        zoom: 1.05,
        timestamp: Date.now(),
      });
    }
  };

  const handleSelectBuilding = (bldg: BuildingShell) => {
    setSelectedBuildingId(bldg.id);
    setIsMobilePanelExpanded(true);
    if (sheetView !== 'all' && sheetView !== bldg.sheet) {
      setSheetView('all');
    }
    setFocusTarget({
      x: bldg.x + bldg.width / 2,
      y: bldg.y + bldg.height / 2,
      zoom: 0.9,
      timestamp: Date.now(),
    });
  };

  const handleSetCustomLocation = (x: number, y: number, sheet: 1 | 2) => {
    const snappedNode = snapTapToApprovedRedNode(x, y, sheet, routeNodes);
    setStartPoint({
      type: 'node',
      nodeId: snappedNode.id,
      label: `${snappedNode.name}`,
    });
    setIsSettingLocation(false);
    setActiveStepIndex(null);
    if (selectedLocationId) {
      setIsNavigationActive(true);
    }
  };

  const handleStartGuidedNavigation = () => {
    setIsNavigationActive(true);
    if (activeRoute && activeRoute.steps.length > 0) {
      setActiveStepIndex(0);
      const firstStep = activeRoute.steps[0];
      setFocusTarget({
        x: firstStep.x,
        y: firstStep.y,
        zoom: 1.1,
        timestamp: Date.now(),
      });
    }
  };

  const handleStepChange = (nextIndex: number) => {
    if (!activeRoute) return;
    const clamped = Math.max(0, Math.min(activeRoute.steps.length - 1, nextIndex));
    setActiveStepIndex(clamped);
    const step = activeRoute.steps[clamped];
    setFocusTarget({
      x: step.x,
      y: step.y,
      zoom: 1.15,
      timestamp: Date.now(),
    });
  };

  const handleSwapStartAndDestination = () => {
    if (!selectedLocationId || !startPoint || startPoint.type !== 'location') return;
    const oldStartId = startPoint.locationId;
    setStartPoint({ type: 'location', locationId: selectedLocationId });
    setSelectedLocationId(oldStartId);
    setActiveStepIndex(null);
  };

  const handleFindNearestByType = (targetType: LocationType) => {
    if (!startPoint) return;
    const candidates = locations.filter(
      (l) => l.type === targetType && l.connections && l.connections.length > 0
    );
    let bestLoc: CampusLocation | null = null;
    let bestDistance = Infinity;

    for (const cand of candidates) {
      const res = calculateApprovedRedRoute(
        startPoint,
        cand.id,
        locations,
        routeNodes,
        routeConnections
      );
      if (res.status === 'ok' && res.route.totalDistanceMeters < bestDistance) {
        bestDistance = res.route.totalDistanceMeters;
        bestLoc = cand;
      }
    }

    if (bestLoc) {
      handleSelectLocation(bestLoc, true);
      setIsNavigationActive(true);
    }
  };

  const handleUpdateLocation = (updated: CampusLocation) => {
    setLocations((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleResetLocations = () => {
    setLocations(initialLocationsData as CampusLocation[]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await downloadProjectZip(locations);
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleSaveInlineRename = () => {
    if (!selectedLocation || !inlineNameDraft.trim()) return;
    const cleaned = inlineNameDraft.trim().replace(/^UNCONFIRMED:\s*/i, '');
    handleUpdateLocation({
      ...selectedLocation,
      name: cleaned,
      shortLabel: cleaned.slice(0, 18),
      unconfirmed: false,
    });
    setIsInlineRenaming(false);
  };

  const startPointLabel = useMemo(() => {
    if (!startPoint) return 'Not set — Tap "Where am I?"';
    if (startPoint.type === 'node') return startPoint.label || startPoint.nodeId;
    const loc = locations.find((l) => l.id === startPoint.locationId);
    return loc
      ? `${loc.name.replace(/^UNCONFIRMED:\s*/i, '')} (${loc.building})`
      : startPoint.locationId;
  }, [startPoint, locations]);

  return (
    <div className="min-h-screen h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="flex items-center justify-between px-4 sm:px-6 h-14 border-b border-slate-200 bg-white shrink-0 z-30">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setSheetView('all');
          }}
          className="text-lg font-bold tracking-tight text-slate-900 font-display whitespace-nowrap"
        >
          CampusVector
        </a>

        {/* Zone 2: 4 clean text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setSheetView('all')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              sheetView === 'all' ? 'text-slate-900 underline underline-offset-4' : ''
            }`}
          >
            Unified Campus Map
          </button>
          <button
            type="button"
            onClick={() => setSheetView(1)}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              sheetView === 1 ? 'text-slate-900 underline underline-offset-4' : ''
            }`}
          >
            Page 1 (Main Wing)
          </button>
          <button
            type="button"
            onClick={() => setSheetView(2)}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap ${
              sheetView === 2 ? 'text-slate-900 underline underline-offset-4' : ''
            }`}
          >
            Page 2 (Gate & Engineering)
          </button>
          <button
            type="button"
            onClick={() => setIsLabelEditorOpen(true)}
            className="hover:text-slate-900 transition-colors whitespace-nowrap"
          >
            Unconfirmed Audit ({unconfirmedLocations.length})
          </button>
        </nav>

        {/* Zone 3: 2 primary actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsLabelEditorOpen(true)}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Verify Labels</span>
            <span>({unconfirmedLocations.length})</span>
          </button>
          <button
            type="button"
            onClick={handleExportZip}
            disabled={isExportingZip}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExportingZip ? 'Packaging...' : 'Download ZIP'}</span>
          </button>
        </div>
      </header>

      {/* Main Responsive Split Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Navigation & Search Sidebar */}
        <aside className="w-full lg:w-[405px] xl:w-[430px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0 z-20 max-h-[48vh] lg:max-h-none overflow-y-auto">
          {/* 1. Search Section */}
          <div className="p-3.5 sm:p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="campus-search"
                className="block text-xs font-semibold text-slate-600"
              >
                Where do you want to go?
              </label>
              <button
                type="button"
                onClick={() => setIsMobilePanelExpanded((prev) => !prev)}
                className="lg:hidden flex items-center gap-1 text-xs font-semibold text-blue-600"
              >
                <span>{isMobilePanelExpanded ? 'Minimize Panel' : 'Expand Panel'}</span>
                {isMobilePanelExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="campus-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search H5, H4, ICT Lab 1, Masonry, Mosque..."
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-blue-600 transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown List */}
            {searchQuery.trim() !== '' && (
              <div className="mt-2 bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <div className="p-3 text-xs text-slate-500 text-center">
                    No matching rooms or landmarks found for "{searchQuery}".
                  </div>
                ) : (
                  searchResults.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => {
                        handleSelectLocation(loc, true);
                        setSearchQuery('');
                      }}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/70 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {loc.name}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {loc.building} · Page {loc.sheet} · {loc.type}
                        </div>
                      </div>
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Quick Search Examples & Nearest Utility Shortcuts */}
            <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[11px] text-slate-400 shrink-0">Quick:</span>
              {QUICK_SEARCH_EXAMPLES.map((item) => {
                const target = locations.find((l) => l.id === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (target) handleSelectLocation(target, true);
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
                  >
                    {item.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleFindNearestByType('toilet')}
                className="px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Nearest Toilet
              </button>
            </div>
          </div>

          {/* Collapsible Body on Mobile (Always visible on Desktop) */}
          <div className={`${isMobilePanelExpanded ? 'flex' : 'hidden lg:flex'} flex-col flex-1`}>
            {/* 2. Category Filter Bar */}
            <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {CATEGORY_FILTERS.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                      activeCategory === cat.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Current Location ("Where am I?") Control */}
            <div className="p-4 border-b border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-500">
                  Current Location (Start)
                </div>
                <div className="flex items-center gap-1.5">
                  {startPoint?.type === 'location' && selectedLocationId && (
                    <button
                      type="button"
                      onClick={handleSwapStartAndDestination}
                      title="Swap Current Location and Destination"
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                      <span>Swap</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSettingLocation((prev) => !prev)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                      isSettingLocation
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <LocateFixed className="w-3.5 h-3.5" />
                    <span>{isSettingLocation ? 'Tap on Map...' : 'Where am I?'}</span>
                  </button>
                </div>
              </div>

              {/* Dropdown or status for current location */}
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 ring-4 ring-blue-100" />
                <select
                  aria-label="Select starting location"
                  value={
                    startPoint?.type === 'location' ? startPoint.locationId : '__node__'
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val !== '__node__') {
                      setStartPoint({ type: 'location', locationId: val });
                      setActiveStepIndex(null);
                    }
                  }}
                  className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 focus:outline-none focus:border-blue-600"
                >
                  {startPoint?.type === 'node' && (
                    <option value="__node__">● {startPointLabel}</option>
                  )}
                  <optgroup label="Key Entrances & Classrooms">
                    <option value="entrance">Entrance (Main Gate - Page 2)</option>
                    <option value="h4">H4 (Classroom - Page 1)</option>
                    <option value="h5">H5 (Classroom - Page 1)</option>
                    <option value="registrar">Registrar (Admin - Page 1)</option>
                    <option value="mosque">Mosque (North - Page 1)</option>
                  </optgroup>
                  <optgroup label="All Mapped Campus Locations">
                    {locations
                      .filter((loc) => loc.connections && loc.connections.length > 0)
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.building})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {/* 4. Building Inspector (when a building shell is clicked) */}
            {selectedBuilding && (
              <div className="px-4 pt-3 pb-2 border-b border-slate-100 bg-blue-50/40">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="truncate">{selectedBuilding.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBuildingId(null)}
                    className="text-xs text-slate-500 hover:text-slate-800"
                  >
                    Close
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 pb-1">
                  {buildingRooms.map((room) => (
                    <button
                      key={room.id}
                      type="button"
                      onClick={() => handleSelectLocation(room, true)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors whitespace-nowrap ${
                        room.id === selectedLocationId
                          ? 'bg-blue-600 text-white border-blue-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {room.shortLabel || room.name.replace(/^UNCONFIRMED:\s*/i, '')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Destination & Validated Red Route Directions Panel */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
              {selectedLocation ? (
                <div className="space-y-4">
                  {/* Selected Destination Header */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[11px] font-semibold text-slate-500">
                          Destination
                        </div>
                        <h2 className="text-base font-bold text-slate-900 mt-0.5">
                          {selectedLocation.name}
                        </h2>
                        <div className="text-xs text-slate-500 mt-0.5">
                          <span>{selectedLocation.building}</span>
                          <span> · </span>
                          <span>Page {selectedLocation.sheet}</span>
                          <span> · </span>
                          <span className="capitalize">{selectedLocation.type}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setFocusTarget({
                            x: selectedLocation.x + selectedLocation.width / 2,
                            y: selectedLocation.y + selectedLocation.height / 2,
                            zoom: 1.1,
                            timestamp: Date.now(),
                          })
                        }
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
                      >
                        Center Map
                      </button>
                    </div>

                    {/* If this location is UNCONFIRMED, show accuracy warning + quick rename */}
                    {selectedLocation.unconfirmed && (
                      <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200/90 text-xs text-amber-900 space-y-2">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold">
                              Unconfirmed Source PDF Label
                            </div>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              {selectedLocation.visualReading
                                ? `Visual reading: "${selectedLocation.visualReading}". `
                                : ''}
                              {selectedLocation.verificationNote}
                            </p>
                          </div>
                        </div>
                        {!isInlineRenaming ? (
                          <button
                            type="button"
                            onClick={() => {
                              setInlineNameDraft(
                                selectedLocation.name.replace(/^UNCONFIRMED:\s*/i, '')
                              );
                              setIsInlineRenaming(true);
                            }}
                            className="w-full py-1.5 px-3 text-xs font-semibold bg-white text-amber-900 border border-amber-300 rounded-lg hover:bg-amber-100/60 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Confirm or Correct Room Name</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 pt-1">
                            <input
                              type="text"
                              value={inlineNameDraft}
                              onChange={(e) => setInlineNameDraft(e.target.value)}
                              placeholder="Enter confirmed name..."
                              className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:border-blue-600"
                            />
                            <button
                              type="button"
                              onClick={handleSaveInlineRename}
                              className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Primary Action Buttons */}
                    {routeResult?.status === 'ok' && (
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleStartGuidedNavigation}
                          className="col-span-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors whitespace-nowrap"
                        >
                          <Navigation className="w-4 h-4" />
                          <span>START NAVIGATION</span>
                        </button>
                        {selectedLocation.connections &&
                          selectedLocation.connections.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setStartPoint({
                                  type: 'location',
                                  locationId: selectedLocation.id,
                                });
                                setActiveStepIndex(null);
                              }}
                              className="col-span-2 py-1.5 px-3 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                            >
                              <LocateFixed className="w-3.5 h-3.5 text-blue-600" />
                              <span>
                                Set "{selectedLocation.shortLabel || selectedLocation.name}" as
                                My Current Location
                              </span>
                            </button>
                          )}
                      </div>
                    )}
                  </div>

                  {/* Strict Rejection Notice when NO Approved Red Route Exists */}
                  {routeResult?.status === 'no-route' && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-950 space-y-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                        <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Route Rejected — Unmapped Access</span>
                      </div>
                      <p className="text-xs font-semibold text-red-900">
                        {routeResult.message}
                      </p>
                      <p className="text-[11px] text-red-700">
                        The navigation engine strictly follows the manually defined red route
                        network on the updated map and never invents shortcuts through unmapped
                        areas or buildings.
                      </p>
                    </div>
                  )}

                  {/* Active Guided Stepper Controls */}
                  {activeRoute && activeStepIndex !== null && (
                    <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-950 font-mono tabular-nums">
                          Step {activeStepIndex + 1} of {activeRoute.steps.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveStepIndex(null)}
                          className="text-blue-700 hover:underline font-medium"
                        >
                          Exit Step-by-Step
                        </button>
                      </div>
                      <div className="text-xs font-semibold text-slate-900">
                        {activeRoute.steps[activeStepIndex]?.instruction}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          type="button"
                          disabled={activeStepIndex === 0}
                          onClick={() => handleStepChange(activeStepIndex - 1)}
                          className="flex-1 py-1.5 px-2.5 text-xs font-semibold bg-white border border-blue-200 rounded-lg disabled:opacity-40 hover:bg-blue-100/50 flex items-center justify-center gap-1"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                          <span>Previous</span>
                        </button>
                        <button
                          type="button"
                          disabled={activeStepIndex >= activeRoute.steps.length - 1}
                          onClick={() => handleStepChange(activeStepIndex + 1)}
                          className="flex-1 py-1.5 px-2.5 text-xs font-semibold bg-blue-600 text-white rounded-lg disabled:opacity-40 hover:bg-blue-700 flex items-center justify-center gap-1"
                        >
                          <span>Next Step</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Validated Red Route Step-by-Step Breakdown */}
                  {activeRoute && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                          <Route className="w-4 h-4 text-blue-600" />
                          <span>Approved Red Route</span>
                        </div>
                        <div className="text-xs font-mono tabular-nums text-slate-600">
                          {activeRoute.totalDistanceMeters} m · ~{activeRoute.estimatedMinutes}{' '}
                          min
                        </div>
                      </div>

                      {/* Route Validation Verification Line */}
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          Validated: {activeRoute.approvedConnectionIds.length} approved
                          red-route segments (0 shortcuts)
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                        {activeRoute.steps.map((step, index) => {
                          const isFirst = index === 0;
                          const isLast = index === activeRoute.steps.length - 1;
                          const isCurrentStep = activeStepIndex === index;
                          return (
                            <div key={`${step.id}-${index}`} className="flex flex-col">
                              <button
                                type="button"
                                onClick={() => handleStepChange(index)}
                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                                  isCurrentStep
                                    ? 'bg-amber-50 border border-amber-300'
                                    : 'hover:bg-slate-100'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span
                                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                      isCurrentStep
                                        ? 'bg-amber-500 ring-2 ring-amber-200'
                                        : isFirst
                                        ? 'bg-blue-600 ring-2 ring-blue-200'
                                        : isLast
                                        ? 'bg-red-600 ring-2 ring-red-200'
                                        : step.nodeType === 'corridor'
                                        ? 'bg-indigo-500'
                                        : 'bg-red-500'
                                    }`}
                                  />
                                  <span
                                    className={`text-xs truncate ${
                                      isFirst || isLast || isCurrentStep
                                        ? 'font-bold text-slate-900'
                                        : 'font-medium text-slate-700'
                                    }`}
                                  >
                                    {step.instruction}
                                  </span>
                                </div>
                                {step.distanceUnits > 0 && (
                                  <span className="text-[11px] font-mono tabular-nums text-slate-400 shrink-0">
                                    +{step.distanceUnits}m
                                  </span>
                                )}
                              </button>
                              {!isLast && (
                                <div className="pl-5 py-0.5 text-slate-300">
                                  <ArrowDown className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  Tap any building or room on the interactive map or use the search bar above
                  to view details and calculate a route.
                </div>
              )}

              {/* Digitization Summary Footer */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                <span>{routeNodes.length} Red Nodes</span>
                <span>·</span>
                <span>{routeConnections.length} Connections</span>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => setIsLabelEditorOpen(true)}
                  className="text-amber-700 hover:underline font-sans font-semibold"
                >
                  {unconfirmedLocations.length} Unconfirmed
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Main Viewport: Interactive Vector School Map */}
        <main className="flex-1 h-full relative overflow-hidden">
          <CampusMap
            locations={locations}
            buildings={buildings}
            routeNodes={routeNodes}
            routeConnections={routeConnections}
            selectedLocationId={selectedLocationId}
            selectedBuildingId={selectedBuildingId}
            startPoint={startPoint}
            activeRoute={activeRoute}
            activeStepIndex={activeStepIndex}
            activeCategory={activeCategory}
            sheetView={sheetView}
            isSettingLocation={isSettingLocation}
            showGraphOverlay={showGraphOverlay}
            highlightUnconfirmed={highlightUnconfirmed}
            focusTarget={focusTarget}
            onSelectLocation={(loc) => handleSelectLocation(loc, false)}
            onSelectBuilding={handleSelectBuilding}
            onSetCustomLocation={handleSetCustomLocation}
            onToggleSetLocationMode={() => setIsSettingLocation((prev) => !prev)}
            onToggleGraphOverlay={() => setShowGraphOverlay((prev) => !prev)}
            onToggleHighlightUnconfirmed={() =>
              setHighlightUnconfirmed((prev) => !prev)
            }
            onSheetViewChange={setSheetView}
          />
        </main>
      </div>

      {/* Modal for Reviewing & Editing Unconfirmed Labels */}
      <LabelEditorModal
        isOpen={isLabelEditorOpen}
        locations={locations}
        onClose={() => setIsLabelEditorOpen(false)}
        onUpdateLocation={handleUpdateLocation}
        onResetLocations={handleResetLocations}
        onFocusLocation={(loc) => handleSelectLocation(loc, true)}
      />
    </div>
  );
}
