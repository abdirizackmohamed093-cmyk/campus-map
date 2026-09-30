import React, { useEffect, useRef, useState } from 'react';
import {
  BuildingShell,
  CalculatedRoute,
  CampusLocation,
  LocationType,
  RouteConnection,
  RouteNode,
} from '../types/campus';
import {
  ARCHITECTURAL_PALETTES,
  ArchitecturalBuildingShell,
  RoomInteriorFixtures,
} from './ArchitecturalElements';
import {
  AlertTriangle,
  Compass,
  Layers,
  LocateFixed,
  Maximize2,
  Network,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

interface CampusMapProps {
  locations: CampusLocation[];
  buildings: BuildingShell[];
  routeNodes: RouteNode[];
  routeConnections: RouteConnection[];
  selectedLocationId: string | null;
  selectedBuildingId: string | null;
  startPoint:
    | { type: 'location'; locationId: string }
    | { type: 'node'; nodeId: string; label?: string }
    | null;
  activeRoute: CalculatedRoute | null;
  activeStepIndex: number | null;
  activeCategory: LocationType | 'all' | 'unconfirmed';
  sheetView: 'all' | 1 | 2;
  isSettingLocation: boolean;
  showGraphOverlay: boolean;
  highlightUnconfirmed: boolean;
  focusTarget: { x: number; y: number; zoom?: number; timestamp: number } | null;
  onSelectLocation: (loc: CampusLocation) => void;
  onSelectBuilding: (bldg: BuildingShell) => void;
  onSetCustomLocation: (x: number, y: number, sheet: 1 | 2) => void;
  onToggleSetLocationMode: () => void;
  onToggleGraphOverlay: () => void;
  onToggleHighlightUnconfirmed: () => void;
  onSheetViewChange: (sheet: 'all' | 1 | 2) => void;
}

/**
 * Splits a room label into 1–3 balanced lines so it fits neatly inside its architectural room plaque.
 */
function wrapRoomLabel(label: string, boxWidth: number): string[] {
  const clean = label.trim();
  if (boxWidth >= 150 || !clean.includes(' ')) {
    return [clean];
  }
  const maxCharsPerLine = Math.max(5, Math.floor(boxWidth / 6.6));
  if (clean.length <= maxCharsPerLine) {
    return [clean];
  }

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (!current) {
      current = word;
    } else if ((current + ' ' + word).length <= maxCharsPerLine) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  if (lines.length > 3) {
    return [lines[0], lines[1], lines.slice(2).join(' ')];
  }
  return lines;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  locations,
  buildings,
  routeNodes,
  routeConnections,
  selectedLocationId,
  selectedBuildingId,
  startPoint,
  activeRoute,
  activeStepIndex,
  activeCategory,
  sheetView,
  isSettingLocation,
  showGraphOverlay,
  highlightUnconfirmed,
  focusTarget,
  onSelectLocation,
  onSelectBuilding,
  onSetCustomLocation,
  onToggleSetLocationMode,
  onToggleGraphOverlay,
  onToggleHighlightUnconfirmed,
  onSheetViewChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan and zoom transform state
  const [scale, setScale] = useState<number>(0.68);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 40, y: 20 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragMovedRef = useRef<boolean>(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null);
  const [showArchitecturalInterior, setShowArchitecturalInterior] = useState<boolean>(true);

  // Touch pinch-to-zoom state
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchCenterRef = useRef<{ x: number; y: number } | null>(null);

  // Adjust viewport when sheetView changes
  useEffect(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mapW = 1600;
    if (sheetView === 1) {
      const fitScale = Math.min(rect.width / mapW, rect.height / 1060) * 0.94;
      const clamped = Math.max(0.32, Math.min(1.4, fitScale));
      setScale(clamped);
      setTranslate({
        x: (rect.width - mapW * clamped) / 2,
        y: Math.max(12, (rect.height - 1020 * clamped) / 2),
      });
    } else if (sheetView === 2) {
      const fitScale = Math.min(rect.width / mapW, rect.height / 1060) * 0.94;
      const clamped = Math.max(0.32, Math.min(1.4, fitScale));
      setScale(clamped);
      setTranslate({
        x: (rect.width - mapW * clamped) / 2,
        y: Math.max(12, (rect.height - 1050 * clamped) / 2) - 1100 * clamped,
      });
    } else {
      const fitScale = Math.min(rect.width / mapW, rect.height / 2180) * 0.94;
      const clamped = Math.max(0.26, Math.min(1.2, fitScale));
      setScale(clamped);
      setTranslate({
        x: (rect.width - mapW * clamped) / 2,
        y: Math.max(12, (rect.height - 2160 * clamped) / 2),
      });
    }
  }, [sheetView]);

  // Center on focusTarget when triggered by search, building click, or turn-by-turn navigation
  useEffect(() => {
    if (!focusTarget || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const targetScale = focusTarget.zoom ?? Math.max(scale, 0.95);
    setScale(targetScale);
    setTranslate({
      x: rect.width / 2 - focusTarget.x * targetScale,
      y: rect.height / 2 - focusTarget.y * targetScale,
    });
  }, [focusTarget]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.14 : 0.88;
    const nextScale = Math.max(0.22, Math.min(3.4, scale * zoomFactor));

    const nextX = mouseX - ((mouseX - translate.x) / scale) * nextScale;
    const nextY = mouseY - ((mouseY - translate.y) / scale) * nextScale;

    setScale(nextScale);
    setTranslate({ x: nextX, y: nextY });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && containerRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const rect = containerRef.current.getBoundingClientRect();
      pinchDistanceRef.current = dist;
      pinchCenterRef.current = {
        x: (t1.clientX + t2.clientX) / 2 - rect.left,
        y: (t1.clientY + t2.clientY) / 2 - rect.top,
      };
      setIsDragging(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (
      e.touches.length === 2 &&
      pinchDistanceRef.current !== null &&
      pinchCenterRef.current !== null
    ) {
      e.preventDefault();
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const ratio = dist / pinchDistanceRef.current;
      const nextScale = Math.max(0.22, Math.min(3.4, scale * ratio));

      const cx = pinchCenterRef.current.x;
      const cy = pinchCenterRef.current.y;
      const nextX = cx - ((cx - translate.x) / scale) * nextScale;
      const nextY = cy - ((cy - translate.y) / scale) * nextScale;

      pinchDistanceRef.current = dist;
      setScale(nextScale);
      setTranslate({ x: nextX, y: nextY });
    }
  };

  const handleTouchEnd = () => {
    pinchDistanceRef.current = null;
    pinchCenterRef.current = null;
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    dragMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX - translate.x,
      y: e.clientY - translate.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || pinchDistanceRef.current !== null) return;
    const dx = e.clientX - dragStartRef.current.x - translate.x;
    const dy = e.clientY - dragStartRef.current.y - translate.y;
    if (Math.hypot(dx, dy) > 4) {
      dragMovedRef.current = true;
    }
    setTranslate({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    // If user is in "Set my location" tap mode and clicked without dragging
    if (isSettingLocation && !dragMovedRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mapX = Math.round((e.clientX - rect.left - translate.x) / scale);
      const mapY = Math.round((e.clientY - rect.top - translate.y) / scale);
      const clampedX = Math.max(20, Math.min(1580, mapX));
      const clampedY = Math.max(20, Math.min(2160, mapY));
      const tappedSheet: 1 | 2 = clampedY >= 1080 ? 2 : 1;
      onSetCustomLocation(clampedX, clampedY, tappedSheet);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isSettingLocation || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const nextScale = Math.min(3.2, scale * 1.35);
    setTranslate({
      x: mouseX - ((mouseX - translate.x) / scale) * nextScale,
      y: mouseY - ((mouseY - translate.y) / scale) * nextScale,
    });
    setScale(nextScale);
  };

  const handleZoomButton = (factor: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const nextScale = Math.max(0.22, Math.min(3.4, scale * factor));
    setTranslate({
      x: cx - ((cx - translate.x) / scale) * nextScale,
      y: cy - ((cy - translate.y) / scale) * nextScale,
    });
    setScale(nextScale);
  };

  const handleResetView = () => {
    onSheetViewChange(sheetView);
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mapW = 1600;
    const targetH = sheetView === 'all' ? 2180 : 1060;
    const fitScale = Math.min(rect.width / mapW, rect.height / targetH) * 0.92;
    const clamped = Math.max(0.26, Math.min(1.2, fitScale));
    setScale(clamped);
    setTranslate({
      x: (rect.width - mapW * clamped) / 2,
      y:
        sheetView === 2
          ? Math.max(12, (rect.height - 1050 * clamped) / 2) - 1100 * clamped
          : Math.max(12, (rect.height - targetH * clamped) / 2),
    });
  };

  const nodeMap = new Map<string, RouteNode>(routeNodes.map((n) => [n.id, n]));

  // Compute start marker coordinates (positioned at the mapped entrance or red route node)
  let startCoords: { x: number; y: number; label: string } | null = null;
  if (startPoint) {
    if (startPoint.type === 'node') {
      const rn = nodeMap.get(startPoint.nodeId);
      if (rn) {
        startCoords = {
          x: rn.x,
          y: rn.y,
          label: startPoint.label || rn.name,
        };
      }
    } else {
      const loc = locations.find((l) => l.id === startPoint.locationId);
      if (loc) {
        const accessNode =
          loc.connections && loc.connections.length > 0
            ? nodeMap.get(loc.connections[0])
            : undefined;
        startCoords = {
          x: accessNode ? accessNode.x : loc.x + loc.width / 2,
          y: accessNode ? accessNode.y : loc.y + loc.height / 2,
          label: loc.shortLabel || loc.name.replace(/^UNCONFIRMED:\s*/i, ''),
        };
      }
    }
  }

  const selectedLocation = locations.find((l) => l.id === selectedLocationId) || null;
  const activeStep =
    activeRoute && activeStepIndex !== null && activeRoute.steps[activeStepIndex]
      ? activeRoute.steps[activeStepIndex]
      : null;

  // Filter visible sheets
  const visibleBuildings = buildings.filter(
    (b) => sheetView === 'all' || b.sheet === sheetView
  );
  const visibleLocations = locations.filter(
    (l) => sheetView === 'all' || l.sheet === sheetView
  );
  const visibleRouteNodes = routeNodes.filter(
    (n) => sheetView === 'all' || n.sheet === sheetView
  );

  // Build visible edges from routeConnections.json
  const visibleEdges = routeConnections
    .map((conn) => {
      const fromNode = nodeMap.get(conn.from);
      const toNode = nodeMap.get(conn.to);
      if (!fromNode || !toNode) return null;
      if (
        sheetView !== 'all' &&
        fromNode.sheet !== sheetView &&
        toNode.sheet !== sheetView
      ) {
        return null;
      }
      return {
        ...conn,
        x1: fromNode.x,
        y1: fromNode.y,
        x2: toNode.x,
        y2: toNode.y,
      };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      className={`relative w-full h-full overflow-hidden select-none touch-none bg-[#EEF2F6] ${
        isSettingLocation
          ? 'cursor-crosshair'
          : isDragging
          ? 'cursor-grabbing'
          : 'cursor-grab'
      }`}
    >
      {/* Top Floating Sheet Switcher & Map Mode Controls */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none"
      >
        {/* Sheet Switcher (PDF Page 1, Page 2, or Unified Campus) */}
        <div className="flex items-center gap-1 p-1 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl shadow-sm pointer-events-auto">
          <button
            type="button"
            onClick={() => onSheetViewChange('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              sheetView === 'all'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Full Campus (P1 + P2)
          </button>
          <button
            type="button"
            onClick={() => onSheetViewChange(1)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              sheetView === 1
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Page 1: Main
          </button>
          <button
            type="button"
            onClick={() => onSheetViewChange(2)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap min-h-[36px] ${
              sheetView === 2
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Page 2: Gate & Eng
          </button>
        </div>

        {/* Action Toggles: Where am I, Interior Detail, Red Route Network, Unconfirmed Highlight */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={onToggleSetLocationMode}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap min-h-[40px] ${
              isSettingLocation
                ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                : 'bg-white/95 text-slate-800 border-slate-200/90 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <LocateFixed
              className="w-4 h-4 shrink-0 text-blue-600"
              style={isSettingLocation ? { color: '#fff' } : undefined}
            />
            <span>{isSettingLocation ? 'Tap map...' : 'Where am I?'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowArchitecturalInterior((prev) => !prev)}
            title="Toggle classroom desks, doors, walls, and interior floorplan fixtures"
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap min-h-[40px] ${
              showArchitecturalInterior
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white/95 text-slate-700 border-slate-200/90 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Room Interiors</span>
          </button>

          <button
            type="button"
            onClick={onToggleHighlightUnconfirmed}
            title="Highlight locations with unclear or missing handwritten labels on the source PDF"
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap min-h-[40px] ${
              highlightUnconfirmed
                ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                : 'bg-white/95 text-slate-700 border-slate-200/90 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Unconfirmed</span>
          </button>

          <button
            type="button"
            onClick={onToggleGraphOverlay}
            title="Inspect Approved Red Route Network nodes and connection IDs"
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap min-h-[40px] ${
              showGraphOverlay
                ? 'bg-red-600 text-white border-red-700 shadow-sm'
                : 'bg-white/95 text-slate-700 border-slate-200/90 hover:bg-slate-50 shadow-sm'
            }`}
          >
            <Network className="w-3.5 h-3.5 shrink-0 text-red-600" style={showGraphOverlay ? { color: '#fff' } : undefined} />
            <span className="hidden md:inline">Red Route Graph</span>
          </button>
        </div>
      </div>

      {/* Active Mode Banner when user clicks "Where am I?" */}
      {isSettingLocation && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white px-4 py-2 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 border border-blue-400 whitespace-nowrap"
        >
          <LocateFixed className="w-4 h-4 animate-pulse shrink-0" />
          <span>Tap your position on the map (snaps to nearest Approved Red Route)</span>
          <button
            type="button"
            onClick={onToggleSetLocationMode}
            className="ml-2 underline hover:text-blue-100"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Zoom & Compass Controls (Bottom-Right) */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute bottom-5 right-4 z-20 flex flex-col gap-1 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl border border-slate-200/90 shadow-md"
      >
        <button
          type="button"
          onClick={() => handleZoomButton(1.25)}
          aria-label="Zoom in"
          className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="text-[10px] font-mono tabular-nums text-center text-slate-500 py-0.5 border-y border-slate-100">
          {Math.round(scale * 100)}%
        </div>
        <button
          type="button"
          onClick={() => handleZoomButton(0.8)}
          aria-label="Zoom out"
          className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleResetView}
          aria-label="Fit map to screen"
          title="Reset view"
          className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 active:scale-95 transition-all border-t border-slate-100"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main Interactive Vector SVG Canvas */}
      <svg
        ref={svgRef}
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Architectural Campus Grounds Grid */}
          <pattern id="campus-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="0.6"
              opacity="0.55"
            />
            <circle cx="20" cy="20" r="0.8" fill="#94A3B8" opacity="0.5" />
          </pattern>

          {/* Grass Turf Stripes for Sports Fields */}
          <pattern
            id="field-grass"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            <rect width="24" height="48" fill="#DCFCE7" />
            <rect x="24" width="24" height="48" fill="#D1FAE5" />
          </pattern>

          {/* Blue Corridor Arrow Marker */}
          <marker
            id="corridor-arrow-end"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1D4ED8" />
          </marker>
        </defs>

        <g transform={`translate(${translate.x}, ${translate.y}) scale(${scale})`}>
          {/* Base Campus Sheet Canvas */}
          <rect
            x="0"
            y="0"
            width="1600"
            height="2180"
            rx="24"
            fill="url(#campus-grid)"
          />

          {/* Page 1 & Page 2 Campus Grounds Zones */}
          {(sheetView === 'all' || sheetView === 1) && (
            <g>
              <rect
                x="15"
                y="18"
                width="1570"
                height="1030"
                rx="18"
                fill="#F8FAFC"
                fillOpacity="0.88"
                stroke="#CBD5E1"
                strokeWidth="2"
              />
              <text
                x="35"
                y="36"
                fill="#475569"
                fontSize="11"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                CAMPUS SECTOR 1 (PDF PAGE 1) — ACADEMIC BLOCKS, MOSQUE, LIBRARY, FIELD, MASONRY & ADMIN
              </text>
            </g>
          )}

          {(sheetView === 'all' || sheetView === 2) && (
            <g>
              <rect
                x="15"
                y="1105"
                width="1570"
                height="1055"
                rx="18"
                fill="#F8FAFC"
                fillOpacity="0.88"
                stroke="#CBD5E1"
                strokeWidth="2"
              />
              <text
                x="35"
                y="1125"
                fill="#475569"
                fontSize="11"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                CAMPUS SECTOR 2 (PDF PAGE 2) — MAIN GATE, SOUTH FIELD, DISPENSARY & ENGINEERING COMPLEXES
              </text>
            </g>
          )}

          {/* Approved Red Route Network (Traced Strictly from Updated PDF) */}
          <g className="approved-red-routes">
            {visibleEdges.map((edge) => {
              const isCorridor = edge.kind === 'building-corridor';
              const isSpur = edge.kind === 'red-spur';
              return (
                <g key={edge.id}>
                  {/* Outer road curb */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={isCorridor ? '#93C5FD' : '#FCA5A5'}
                    strokeWidth={isCorridor ? 8 : isSpur ? 7 : 15}
                    strokeLinecap="round"
                    opacity={0.75}
                  />
                  {/* Authoritative Red Route Line (or Blue Indoor Corridor) */}
                  <line
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={isCorridor ? '#2563EB' : '#EF4444'}
                    strokeWidth={isCorridor ? 3.5 : isSpur ? 3.5 : 8}
                    strokeLinecap="round"
                    opacity={isCorridor ? 0.5 : 0.72}
                  />
                </g>
              );
            })}
          </g>

          {/* Page 1 Specific Architectural Landmarks from Source PDF */}
          {(sheetView === 'all' || sheetView === 1) && (
            <g>
              {/* Small light-blue marker to the left of dark-blue G4 on Page 1 */}
              <rect
                x="306"
                y="194"
                width="8"
                height="24"
                rx="2"
                fill="#38BDF8"
                stroke="#0284C7"
                strokeWidth="1.5"
              />
              {/* Bottom-right partial structure foundation visible at bottom edge of Page 1 */}
              <path
                d="M 1245 1042 L 1252 990 L 1378 990 L 1372 1042"
                fill="#E2E8F0"
                fillOpacity="0.5"
                stroke="#1E293B"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {/* Mosque North Pointer Sign from Page 1 */}
              <text
                x="912"
                y="36"
                fill="#0F172A"
                fontSize="16"
                fontWeight="700"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                Mosque
              </text>
              <path
                d="M 915 41 L 930 55 M 930 55 L 921 54 M 930 55 L 929 46"
                stroke="#0F172A"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Page 2 Specific Architectural Gate & Driveway Roadway from Source PDF */}
          {(sheetView === 'all' || sheetView === 2) && (
            <g>
              {/* Paved North Approach Roadway above ILO Office */}
              <path
                d="M 124 1275 L 132 1135 L 212 1135 L 204 1275 Z"
                fill="#E2E8F0"
                stroke="#1E293B"
                strokeWidth="2.5"
              />
              <line
                x1="168"
                y1="1138"
                x2="164"
                y2="1272"
                stroke="#64748B"
                strokeWidth="1.5"
                strokeDasharray="8 6"
              />
              {/* Main Gate Asphalt Driveway between Entrance and Exit */}
              <rect
                x="72"
                y="1404"
                width="86"
                height="48"
                fill="#334155"
              />
              <line
                x1="72"
                y1="1404"
                x2="76"
                y2="1452"
                stroke="#2563EB"
                strokeWidth="4.5"
              />
              <line
                x1="158"
                y1="1404"
                x2="154"
                y2="1452"
                stroke="#2563EB"
                strokeWidth="4.5"
              />
              <line
                x1="115"
                y1="1406"
                x2="115"
                y2="1450"
                stroke="#FACC15"
                strokeWidth="2"
                strokeDasharray="6 4"
              />
            </g>
          )}

          {/* Real Architectural Building Shells (Foundation Apron + 3D Extruded Walls + Facade Windows) */}
          {visibleBuildings.map((bldg) => (
            <ArchitecturalBuildingShell
              key={bldg.id}
              bldg={bldg}
              isSelected={bldg.id === selectedBuildingId}
              isHovered={bldg.id === hoveredBuildingId}
              scale={scale}
              onSelect={() => {
                if (!dragMovedRef.current) {
                  onSelectBuilding(bldg);
                }
              }}
              onHoverChange={(hov) => setHoveredBuildingId(hov ? bldg.id : null)}
            />
          ))}

          {/* Individual Selectable Architectural Rooms, Classrooms, Labs, Workshops & Landmarks */}
          {visibleLocations.map((loc) => {
            const isSelected = loc.id === selectedLocationId;
            const isStart =
              startPoint?.type === 'location' && startPoint.locationId === loc.id;
            const isHovered = loc.id === hoveredId;

            const matchesCategory =
              activeCategory === 'all' ||
              (activeCategory === 'unconfirmed' && loc.unconfirmed) ||
              loc.type === activeCategory;

            const palette =
              ARCHITECTURAL_PALETTES[loc.colorScheme || 'white-outline'] ||
              ARCHITECTURAL_PALETTES['white-outline'];

            const cleanLabel =
              loc.shortLabel || loc.name.replace(/^UNCONFIRMED:\s*/i, '');

            const wrappedLines = wrapRoomLabel(cleanLabel, loc.width);

            const baseFontSize =
              loc.type === 'field'
                ? 24
                : loc.id === 'homestead'
                ? 13
                : loc.width < 52
                ? 9
                : loc.width < 75
                ? 10
                : loc.width < 110
                ? 10.8
                : 11.5;

            const lineHeight = baseFontSize * 1.16;
            const cx = loc.x + loc.width / 2;
            const cy = loc.y + loc.height / 2;

            // Plaque dimensions so room label is crisp over the interior desks
            const longestLineChars = Math.max(...wrappedLines.map((l) => l.length), 3);
            const plaqueW = Math.min(
              loc.width - 6,
              Math.max(28, longestLineChars * (baseFontSize * 0.62) + 12)
            );
            const plaqueH = Math.min(
              loc.height - 4,
              wrappedLines.length * lineHeight + 7
            );
            const startTextY =
              cy - ((wrappedLines.length - 1) * lineHeight) / 2 + baseFontSize * 0.34;

            // Position doorway at the mapped access node on the room boundary if available
            const mappedAccessNode =
              loc.connections && loc.connections.length > 0
                ? nodeMap.get(loc.connections[0])
                : undefined;

            return (
              <g
                key={loc.id}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!dragMovedRef.current) {
                    onSelectLocation(loc);
                  }
                }}
                onPointerEnter={() => setHoveredId(loc.id)}
                onPointerLeave={() => setHoveredId(null)}
                className="cursor-pointer transition-opacity duration-150"
                opacity={matchesCategory ? 1 : 0.25}
              >
                {/* 1. Outer Structural Room Wall & Floor Surface */}
                {loc.type === 'mosque' ? (
                  <g>
                    <ellipse
                      cx={cx + 2}
                      cy={cy + 3}
                      rx={loc.width / 2}
                      ry={loc.height / 2}
                      fill="#0F172A"
                      fillOpacity="0.16"
                    />
                    <ellipse
                      cx={cx}
                      cy={cy}
                      rx={loc.width / 2}
                      ry={loc.height / 2}
                      fill={palette.floorFill}
                      stroke={isSelected ? '#2563EB' : palette.wallOuter}
                      strokeWidth={isSelected ? 4 : 3}
                    />
                  </g>
                ) : (
                  <g>
                    <rect
                      x={loc.x}
                      y={loc.y}
                      width={loc.width}
                      height={loc.height}
                      rx={loc.type === 'field' ? 12 : 3}
                      fill={
                        loc.type === 'field'
                          ? 'url(#field-grass)'
                          : palette.floorFill
                      }
                      stroke={
                        isSelected
                          ? '#2563EB'
                          : isStart
                          ? '#0284C7'
                          : isHovered
                          ? '#0F172A'
                          : palette.wallOuter
                      }
                      strokeWidth={
                        isSelected || isStart ? 3.8 : isHovered ? 3 : 2.4
                      }
                    />

                    {/* Inner Partition Wall Trim & Color-Coded Header Band */}
                    {loc.type !== 'field' && loc.id !== 'homestead' && (
                      <>
                        <rect
                          x={loc.x + 2}
                          y={loc.y + 2}
                          width={Math.max(0, loc.width - 4)}
                          height={Math.min(7, loc.height * 0.18)}
                          fill={palette.wallInner}
                          opacity="0.88"
                        />
                        <rect
                          x={loc.x + 2.5}
                          y={loc.y + 2.5}
                          width={Math.max(0, loc.width - 5)}
                          height={Math.max(0, loc.height - 5)}
                          fill="none"
                          stroke={palette.floorAccent}
                          strokeWidth="1"
                        />
                      </>
                    )}
                  </g>
                )}

                {/* 2. Interior Classroom Desks, Lab PCs, Workshop Bays, Office Furniture & Pitch Lines */}
                {showArchitecturalInterior && (
                  <RoomInteriorFixtures loc={loc} palette={palette} />
                )}

                {/* 3. Legitimate Mapped Entrance Threshold Marker at `access-*` Node */}
                {mappedAccessNode && loc.type !== 'field' && (
                  <g className="pointer-events-none">
                    <circle
                      cx={mappedAccessNode.x}
                      cy={mappedAccessNode.y}
                      r="3.8"
                      fill="#FFFFFF"
                      stroke="#DC2626"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {/* 4. Selection / Hover Highlight Glow */}
                {(isSelected || isHovered) && loc.type !== 'mosque' && (
                  <rect
                    x={loc.x + 1.5}
                    y={loc.y + 1.5}
                    width={Math.max(0, loc.width - 3)}
                    height={Math.max(0, loc.height - 3)}
                    rx="2"
                    fill={isSelected ? '#2563EB' : '#0F172A'}
                    fillOpacity={isSelected ? 0.16 : 0.06}
                    stroke={isSelected ? '#3B82F6' : 'none'}
                    strokeWidth="1.5"
                  />
                )}

                {/* 5. Amber Dashed Audit Indicator for UNCONFIRMED Locations */}
                {loc.unconfirmed && highlightUnconfirmed && (
                  <g className="pointer-events-none">
                    <rect
                      x={loc.x + 3}
                      y={loc.y + 3}
                      width={Math.max(0, loc.width - 6)}
                      height={Math.max(0, loc.height - 6)}
                      rx="2"
                      fill="#F59E0B"
                      fillOpacity="0.10"
                      stroke="#D97706"
                      strokeWidth="1.6"
                      strokeDasharray="4 3"
                    />
                    <circle
                      cx={loc.x + loc.width - 8.5}
                      cy={loc.y + 8.5}
                      r="6"
                      fill="#F59E0B"
                      stroke="#FFFFFF"
                      strokeWidth="1.2"
                    />
                    <text
                      x={loc.x + loc.width - 8.5}
                      y={loc.y + 11.5}
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize="8.5"
                      fontWeight="700"
                    >
                      ?
                    </text>
                  </g>
                )}

                {/* 6. Architectural Room Signage Plaque & Multi-line Typography */}
                <g className="pointer-events-none select-none">
                  <rect
                    x={cx - plaqueW / 2}
                    y={cy - plaqueH / 2}
                    width={plaqueW}
                    height={plaqueH}
                    rx="4"
                    fill={palette.labelBg}
                    stroke={isSelected ? '#60A5FA' : palette.labelBorder}
                    strokeWidth={isSelected ? 1.5 : 0.9}
                  />
                  <text
                    x={cx}
                    y={startTextY}
                    textAnchor="middle"
                    fill={palette.labelText}
                    fontSize={baseFontSize}
                    fontWeight="700"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                  >
                    {wrappedLines.map((line, idx) => (
                      <tspan
                        key={idx}
                        x={cx}
                        dy={idx === 0 ? 0 : lineHeight}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                </g>
              </g>
            );
          })}

          {/* Thick Structural Firewall Partitions shown on Source PDF (between H5/H6 and in Building B) */}
          {(sheetView === 'all' || sheetView === 1) && (
            <rect
              x="133"
              y="328"
              width="8"
              height="96"
              rx="1"
              fill="#0F172A"
            />
          )}
          {(sheetView === 'all' || sheetView === 2) && (
            <rect
              x="844"
              y="1700"
              width="8"
              height="102"
              rx="1"
              fill="#0F172A"
            />
          )}

          {/* Tiled Indoor Building Hallways & Directional Blue Corridor Arrows (from Source PDF) */}
          {visibleBuildings.map((bldg) =>
            bldg.corridors?.map((corr) => (
              <g key={corr.id} className="pointer-events-none">
                <line
                  x1={corr.x1}
                  y1={corr.y1}
                  x2={corr.x2}
                  y2={corr.y2}
                  stroke="#DBEAFE"
                  strokeWidth="8"
                  strokeLinecap="square"
                />
                <line
                  x1={corr.x1}
                  y1={corr.y1}
                  x2={corr.x2}
                  y2={corr.y2}
                  stroke="#93C5FD"
                  strokeWidth="6"
                  strokeDasharray="8 8"
                />
                <line
                  x1={corr.x1}
                  y1={corr.y1}
                  x2={corr.x2}
                  y2={corr.y2}
                  stroke="#1D4ED8"
                  strokeWidth="2.2"
                  markerEnd="url(#corridor-arrow-end)"
                  markerStart={
                    corr.bidirectional ? 'url(#corridor-arrow-end)' : undefined
                  }
                />
              </g>
            ))
          )}

          {/* Optional Red Route Graph Nodes & Connection IDs Inspector Overlay */}
          {showGraphOverlay && (
            <g className="pointer-events-none">
              {visibleEdges.map((edge) => (
                <line
                  key={`graph-${edge.id}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke="#DC2626"
                  strokeWidth="3"
                />
              ))}
              {visibleRouteNodes.map((node) => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.kind === 'access' ? 4.5 : 5.5}
                    fill={
                      node.kind === 'access'
                        ? '#F59E0B'
                        : node.kind === 'corridor'
                        ? '#2563EB'
                        : '#DC2626'
                    }
                    stroke="#FFFFFF"
                    strokeWidth="1.8"
                  />
                  {scale >= 0.72 && (
                    <text
                      x={node.x}
                      y={node.y - 7}
                      textAnchor="middle"
                      fill="#7F1D1D"
                      fontSize="8.5"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {node.id}
                    </text>
                  )}
                </g>
              ))}
            </g>
          )}

          {/* Active Validated Navigation Route Line (Strictly on Approved Red Route Network) */}
          {activeRoute && activeRoute.validated && activeRoute.points.length > 1 && (
            <g className="pointer-events-none">
              {/* Outer glow casing */}
              <polyline
                fill="none"
                stroke="#FEF08A"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={activeRoute.points.map((p) => `${p.x},${p.y}`).join(' ')}
                opacity="0.85"
              />
              {/* Main High-Contrast Route Line */}
              <polyline
                fill="none"
                stroke="#2563EB"
                strokeWidth="6.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={activeRoute.points.map((p) => `${p.x},${p.y}`).join(' ')}
              />
              {/* White Directional Dashes */}
              <polyline
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.4"
                strokeDasharray="6 10"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={activeRoute.points.map((p) => `${p.x},${p.y}`).join(' ')}
              />
              {/* Waypoint junctions along approved route */}
              {activeRoute.points.slice(1, -1).map((pt) => (
                <circle
                  key={pt.id}
                  cx={pt.x}
                  cy={pt.y}
                  r="4.2"
                  fill="#FFFFFF"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                />
              ))}
            </g>
          )}

          {/* Active Turn-by-Turn Step Highlight Beacon */}
          {activeStep && (
            <g
              transform={`translate(${activeStep.x}, ${activeStep.y})`}
              className="pointer-events-none"
            >
              <circle
                cx="0"
                cy="0"
                r="24"
                fill="#F59E0B"
                fillOpacity="0.28"
                stroke="#D97706"
                strokeWidth="2"
                strokeDasharray="4 3"
              />
              <circle
                cx="0"
                cy="0"
                r="7"
                fill="#F59E0B"
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* Current Location Blue Marker (● Current Location) */}
          {startCoords && (
            <g
              transform={`translate(${startCoords.x}, ${startCoords.y})`}
              className="pointer-events-none"
            >
              <circle
                cx="0"
                cy="0"
                r="20"
                fill="#3B82F6"
                fillOpacity="0.22"
              />
              <circle
                cx="0"
                cy="0"
                r="9"
                fill="#2563EB"
                stroke="#FFFFFF"
                strokeWidth="3"
              />
              <g transform="translate(0, -24)">
                <rect
                  x="-66"
                  y="-14"
                  width="132"
                  height="20"
                  rx="6"
                  fill="#1E3A8A"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="10"
                  fontWeight="700"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  ● {startCoords.label.slice(0, 18)}
                </text>
              </g>
            </g>
          )}

          {/* Destination Pin Marker (📍 Selected Destination) */}
          {selectedLocation && (
            <g
              transform={`translate(${
                selectedLocation.x + selectedLocation.width / 2
              }, ${selectedLocation.y + selectedLocation.height / 2})`}
              className="pointer-events-none"
            >
              <circle
                cx="0"
                cy="0"
                r="18"
                fill="#EF4444"
                fillOpacity="0.20"
              />
              <path
                d="M 0 0 C -8 -10 -13 -18 -13 -25 A 13 13 0 1 1 13 -25 C 13 -18 8 -10 0 0 Z"
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
              <circle cx="0" cy="-25" r="4.5" fill="#FFFFFF" />
            </g>
          )}
        </g>
      </svg>

      {/* Clean Interactive Architectural Map Legend (Bottom-Left) */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        className="hidden sm:flex items-center gap-3.5 absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-sm text-[11px] text-slate-700"
      >
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <Compass className="w-3.5 h-3.5 text-blue-600" />
          <span>Map Legend</span>
        </div>
        <span className="text-slate-300">·</span>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-1.5 bg-red-500 rounded-full" />
          <span>Approved Red Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-1.5 bg-blue-600 rounded-full" />
          <span>Active Validated Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-white border-2 border-red-600" />
          <span>Mapped Room Entrance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-1 ring-blue-600" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-600" />
          <span>Destination</span>
        </div>
      </div>
    </div>
  );
};
