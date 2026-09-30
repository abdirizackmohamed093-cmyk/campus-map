import React from 'react';
import { BuildingShell, CampusLocation } from '../types/campus';

/**
 * Architectural color themes that preserve the source PDF's color coding
 * while rendering realistic masonry walls, recessed interior floors, and fixtures.
 */
export const ARCHITECTURAL_PALETTES: Record<
  NonNullable<CampusLocation['colorScheme']>,
  {
    wallOuter: string;
    wallInner: string;
    floorFill: string;
    floorAccent: string;
    fixtureStroke: string;
    fixtureFill: string;
    labelBg: string;
    labelText: string;
    labelBorder: string;
  }
> = {
  purple: {
    wallOuter: '#311B92',
    wallInner: '#512DA8',
    floorFill: '#EDE7F6',
    floorAccent: '#D1C4E9',
    fixtureStroke: '#673AB7',
    fixtureFill: '#DDD2F1',
    labelBg: 'rgba(49, 27, 146, 0.90)',
    labelText: '#FFFFFF',
    labelBorder: '#B39DDB',
  },
  'blue-wood': {
    wallOuter: '#1E3A8A',
    wallInner: '#2563EB',
    floorFill: '#EFF6FF',
    floorAccent: '#DBEAFE',
    fixtureStroke: '#3B82F6',
    fixtureFill: '#BFDBFE',
    labelBg: 'rgba(30, 58, 138, 0.90)',
    labelText: '#FFFFFF',
    labelBorder: '#93C5FD',
  },
  'tan-wood': {
    wallOuter: '#5C3A21',
    wallInner: '#8B5A2B',
    floorFill: '#FDF8F3',
    floorAccent: '#F3E5D8',
    fixtureStroke: '#A06B3B',
    fixtureFill: '#EBD5C1',
    labelBg: 'rgba(92, 58, 33, 0.90)',
    labelText: '#FFFFFF',
    labelBorder: '#D4A373',
  },
  'white-outline': {
    wallOuter: '#1E293B',
    wallInner: '#475569',
    floorFill: '#FFFFFF',
    floorAccent: '#F1F5F9',
    fixtureStroke: '#64748B',
    fixtureFill: '#E2E8F0',
    labelBg: 'rgba(255, 255, 255, 0.94)',
    labelText: '#0F172A',
    labelBorder: '#94A3B8',
  },
  pink: {
    wallOuter: '#831843',
    wallInner: '#BE185D',
    floorFill: '#FDF2F8',
    floorAccent: '#FCE7F3',
    fixtureStroke: '#DB2777',
    fixtureFill: '#FBCFE8',
    labelBg: 'rgba(131, 24, 67, 0.90)',
    labelText: '#FFFFFF',
    labelBorder: '#F472B6',
  },
  'dark-blue': {
    wallOuter: '#172554',
    wallInner: '#1D4ED8',
    floorFill: '#EFF6FF',
    floorAccent: '#DBEAFE',
    fixtureStroke: '#2563EB',
    fixtureFill: '#BFDBFE',
    labelBg: 'rgba(23, 37, 84, 0.92)',
    labelText: '#FFFFFF',
    labelBorder: '#60A5FA',
  },
  yellow: {
    wallOuter: '#713F12',
    wallInner: '#CA8A04',
    floorFill: '#FEFCE8',
    floorAccent: '#FEF08A',
    fixtureStroke: '#B45309',
    fixtureFill: '#FDE047',
    labelBg: 'rgba(254, 240, 138, 0.95)',
    labelText: '#713F12',
    labelBorder: '#CA8A04',
  },
  grey: {
    wallOuter: '#1E293B',
    wallInner: '#475569',
    floorFill: '#F8FAFC',
    floorAccent: '#E2E8F0',
    fixtureStroke: '#475569',
    fixtureFill: '#CBD5E1',
    labelBg: 'rgba(30, 41, 59, 0.90)',
    labelText: '#FFFFFF',
    labelBorder: '#94A3B8',
  },
  orange: {
    wallOuter: '#7C2D12',
    wallInner: '#EA580C',
    floorFill: '#FFF7ED',
    floorAccent: '#FFEDD5',
    fixtureStroke: '#C2410C',
    fixtureFill: '#FED7AA',
    labelBg: 'rgba(124, 45, 18, 0.90)',
    labelText: '#FFFFFF',
    labelBorder: '#FB923C',
  },
  peach: {
    wallOuter: '#7C2D12',
    wallInner: '#C2410C',
    floorFill: '#FFF7ED',
    floorAccent: '#FFEDD5',
    fixtureStroke: '#9A3412',
    fixtureFill: '#FDBA74',
    labelBg: 'rgba(154, 52, 18, 0.90)',
    labelText: '#FFFFFF',
    labelBorder: '#FDBA74',
  },
  green: {
    wallOuter: '#14532D',
    wallInner: '#15803D',
    floorFill: '#F7FEE7',
    floorAccent: '#ECFCCB',
    fixtureStroke: '#3F6212',
    fixtureFill: '#D9F99D',
    labelBg: 'rgba(20, 83, 45, 0.90)',
    labelText: '#FFFFFF',
    labelBorder: '#84CC16',
  },
  teal: {
    wallOuter: '#0C4A6E',
    wallInner: '#0284C7',
    floorFill: '#F0F9FF',
    floorAccent: '#E0F2FE',
    fixtureStroke: '#0369A1',
    fixtureFill: '#BAE6FD',
    labelBg: 'rgba(12, 74, 110, 0.90)',
    labelText: '#FFFFFF',
    labelBorder: '#38BDF8',
  },
  'red-brown': {
    wallOuter: '#451A1C',
    wallInner: '#991B1B',
    floorFill: '#FEF2F2',
    floorAccent: '#FEE2E2',
    fixtureStroke: '#991B1B',
    fixtureFill: '#FECACA',
    labelBg: 'rgba(69, 26, 28, 0.90)',
    labelText: '#FFFFFF',
    labelBorder: '#F87171',
  },
  'black-orange': {
    wallOuter: '#0F172A',
    wallInner: '#334155',
    floorFill: '#1E293B',
    floorAccent: '#0F172A',
    fixtureStroke: '#FB923C',
    fixtureFill: '#334155',
    labelBg: 'rgba(15, 23, 42, 0.94)',
    labelText: '#FB923C',
    labelBorder: '#FB923C',
  },
  field: {
    wallOuter: '#15803D',
    wallInner: '#16A34A',
    floorFill: '#ECFDF5',
    floorAccent: '#D1FAE5',
    fixtureStroke: '#15803D',
    fixtureFill: '#BBF7D0',
    labelBg: 'rgba(20, 83, 45, 0.85)',
    labelText: '#FFFFFF',
    labelBorder: '#4ADE80',
  },
};

/**
 * Renders a realistic architectural Building Structure with:
 * - Concrete apron / perimeter foundation walkway
 * - 2.5D extruded roof/wall shadow
 * - Thick double-line exterior structural walls
 * - Tiled interior corridor floors
 * - Exterior window mullions along the facade
 */
export const ArchitecturalBuildingShell: React.FC<{
  bldg: BuildingShell;
  isSelected: boolean;
  isHovered: boolean;
  scale: number;
  onSelect: () => void;
  onHoverChange: (hovered: boolean) => void;
}> = ({ bldg, isSelected, isHovered, scale, onSelect, onHoverChange }) => {
  const isPurple = bldg.style === 'purple-complex';
  const isGrey = bldg.style === 'grey-complex';

  const wallColor = isSelected
    ? '#2563EB'
    : isPurple
    ? '#311B92'
    : isGrey
    ? '#334155'
    : '#1E293B';

  const foundationColor = isSelected
    ? '#DBEAFE'
    : isPurple
    ? '#EDE7F6'
    : '#E2E8F0';

  // Generate window ticks along the top and bottom exterior walls
  const windowCount = Math.max(2, Math.floor(bldg.width / 36));
  const windowSpacing = bldg.width / windowCount;

  return (
    <g
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
      className="cursor-pointer"
    >
      {/* 1. Concrete Perimeter Sidewalk / Apron */}
      <rect
        x={bldg.x - 10}
        y={bldg.y - 10}
        width={bldg.width + 20}
        height={bldg.height + 20}
        rx="8"
        fill={foundationColor}
        fillOpacity={isSelected ? 0.85 : isHovered ? 0.7 : 0.55}
        stroke="#CBD5E1"
        strokeWidth="1"
      />

      {/* 2. 2.5D Extruded Building Depth Shadow */}
      <rect
        x={bldg.x + 5}
        y={bldg.y + 6}
        width={bldg.width + 4}
        height={bldg.height + 4}
        rx="4"
        fill="#0F172A"
        fillOpacity="0.18"
      />

      {/* 3. Main Building Interior Slab (Corridor Floor Base) */}
      <rect
        x={bldg.x - 4}
        y={bldg.y - 4}
        width={bldg.width + 8}
        height={bldg.height + 8}
        rx="4"
        fill={isPurple ? '#D1C4E9' : '#E2E8F0'}
        stroke={wallColor}
        strokeWidth={isSelected ? 5 : 4}
      />

      {/* 4. Inner Structural Wall Line */}
      <rect
        x={bldg.x - 1.5}
        y={bldg.y - 1.5}
        width={bldg.width + 3}
        height={bldg.height + 3}
        rx="2"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.7"
      />

      {/* 5. Exterior Architectural Window Glazing along North & South Facades */}
      {Array.from({ length: windowCount }).map((_, idx) => {
        const wx = bldg.x + idx * windowSpacing + windowSpacing * 0.2;
        const ww = windowSpacing * 0.6;
        return (
          <g key={`win-${bldg.id}-${idx}`} className="pointer-events-none">
            {/* North facade window */}
            <rect
              x={wx}
              y={bldg.y - 5.5}
              width={ww}
              height="3"
              fill="#38BDF8"
              stroke={wallColor}
              strokeWidth="0.6"
            />
            {/* South facade window */}
            <rect
              x={wx}
              y={bldg.y + bldg.height + 2.5}
              width={ww}
              height="3"
              fill="#38BDF8"
              stroke={wallColor}
              strokeWidth="0.6"
            />
          </g>
        );
      })}

      {/* 6. Building Roof Parapet / Nameplate Sign */}
      {scale >= 0.42 && (
        <g transform={`translate(${bldg.x}, ${bldg.y - 14})`} className="pointer-events-none">
          <rect
            x="0"
            y="-11"
            width={Math.min(bldg.width, bldg.name.length * 6.4 + 16)}
            height="15"
            rx="4"
            fill={isSelected ? '#1D4ED8' : '#0F172A'}
            fillOpacity="0.88"
          />
          <text
            x="7"
            y="-0.5"
            fill="#FFFFFF"
            fontSize="9.5"
            fontWeight="700"
            fontFamily="Plus Jakarta Sans, sans-serif"
          >
            {bldg.name}
          </text>
        </g>
      )}
    </g>
  );
};

/**
 * Renders the interior architectural furniture, fixtures, doors, and floor details
 * for each specific room type (classroom desks, ICT lab computers, workshop bays,
 * office desks, restroom stalls, sports pitch markings, mosque dome/mihrab, etc.).
 */
export const RoomInteriorFixtures: React.FC<{
  loc: CampusLocation;
  palette: (typeof ARCHITECTURAL_PALETTES)['purple'];
}> = ({ loc, palette }) => {
  const { x, y, width: w, height: h, type, id } = loc;
  const pad = 6;
  const ix = x + pad;
  const iy = y + pad;
  const iw = Math.max(10, w - pad * 2);
  const ih = Math.max(10, h - pad * 2);

  // 1. SPORTS FIELD — Real stadium / soccer / athletics pitch markings
  if (type === 'field') {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const pitchX = x + 18;
    const pitchY = y + 16;
    const pitchW = w - 36;
    const pitchH = h - 32;
    const circleR = Math.min(pitchW, pitchH) * 0.22;

    return (
      <g className="pointer-events-none">
        {/* Running track / perimeter border */}
        <rect
          x={x + 8}
          y={y + 8}
          width={w - 16}
          height={h - 16}
          rx="16"
          fill="none"
          stroke="#86EFAC"
          strokeWidth="6"
        />
        {/* Outer Pitch Touchline */}
        <rect
          x={pitchX}
          y={pitchY}
          width={pitchW}
          height={pitchH}
          fill="none"
          stroke="#15803D"
          strokeWidth="2"
          opacity="0.65"
        />
        {/* Halfway Line */}
        <line
          x1={cx}
          y1={pitchY}
          x2={cx}
          y2={pitchY + pitchH}
          stroke="#15803D"
          strokeWidth="2"
          opacity="0.65"
        />
        {/* Center Circle */}
        <circle
          cx={cx}
          cy={cy}
          r={circleR}
          fill="none"
          stroke="#15803D"
          strokeWidth="2"
          opacity="0.65"
        />
        <circle cx={cx} cy={cy} r="3" fill="#15803D" opacity="0.65" />
        {/* Left Penalty Area */}
        <rect
          x={pitchX}
          y={cy - pitchH * 0.28}
          width={pitchW * 0.14}
          height={pitchH * 0.56}
          fill="none"
          stroke="#15803D"
          strokeWidth="1.8"
          opacity="0.65"
        />
        {/* Right Penalty Area */}
        <rect
          x={pitchX + pitchW * 0.86}
          y={cy - pitchH * 0.28}
          width={pitchW * 0.14}
          height={pitchH * 0.56}
          fill="none"
          stroke="#15803D"
          strokeWidth="1.8"
          opacity="0.65"
        />
      </g>
    );
  }

  // 2. MOSQUE — Architectural Dome, Prayer Carpet Rows & Mihrab Niche
  if (type === 'mosque') {
    const cx = x + w / 2;
    const cy = y + h / 2;
    return (
      <g className="pointer-events-none">
        {/* Inner prayer hall sanctuary ring */}
        <ellipse
          cx={cx}
          cy={cy}
          rx={w * 0.42}
          ry={h * 0.4}
          fill="#FFEDD5"
          stroke="#C2410C"
          strokeWidth="1.5"
        />
        {/* Prayer rug lines */}
        {[-12, -4, 4, 12].map((dy) => (
          <line
            key={dy}
            x1={cx - w * 0.28}
            y1={cy + dy}
            x2={cx + w * 0.28}
            y2={cy + dy}
            stroke="#EA580C"
            strokeWidth="1"
            strokeDasharray="3 2"
            opacity="0.55"
          />
        ))}
        {/* Center Dome cupola */}
        <circle
          cx={cx}
          cy={cy}
          r={Math.min(w, h) * 0.22}
          fill="#FDBA74"
          stroke="#9A3412"
          strokeWidth="1.5"
        />
      </g>
    );
  }

  // 3. HOMESTEAD COMPOUND — Courtyard, trees, and main residence house footprint
  if (id === 'homestead') {
    return (
      <g className="pointer-events-none">
        {/* Inner courtyard perimeter path */}
        <rect
          x={x + 16}
          y={y + 16}
          width={w - 32}
          height={h - 32}
          rx="8"
          fill="#F8FAFC"
          stroke="#CBD5E1"
          strokeWidth="1.5"
          strokeDasharray="6 4"
        />
        {/* Main Homestead House Building inside compound */}
        <g transform={`translate(${x + 45}, ${y + 42})`}>
          <rect
            x="0"
            y="0"
            width="120"
            height="72"
            rx="4"
            fill="#E2E8F0"
            stroke="#475569"
            strokeWidth="2"
          />
          {/* Pitched Roof Ridge Lines */}
          <line x1="0" y1="0" x2="25" y2="36" stroke="#64748B" strokeWidth="1.5" />
          <line x1="0" y1="72" x2="25" y2="36" stroke="#64748B" strokeWidth="1.5" />
          <line x1="120" y1="0" x2="95" y2="36" stroke="#64748B" strokeWidth="1.5" />
          <line x1="120" y1="72" x2="95" y2="36" stroke="#64748B" strokeWidth="1.5" />
          <line x1="25" y1="36" x2="95" y2="36" stroke="#475569" strokeWidth="2" />
        </g>
        {/* Secondary Annex Cottage */}
        <g transform={`translate(${x + 185}, ${y + 145})`}>
          <rect
            x="0"
            y="0"
            width="78"
            height="58"
            rx="4"
            fill="#E2E8F0"
            stroke="#475569"
            strokeWidth="1.8"
          />
          <line x1="0" y1="29" x2="78" y2="29" stroke="#64748B" strokeWidth="1.5" />
        </g>
        {/* Courtyard Trees */}
        {[
          { tx: x + 225, ty: y + 58 },
          { tx: x + 245, ty: y + 88 },
          { tx: x + 65, ty: y + 175 },
          { tx: x + 98, ty: y + 195 },
        ].map((tree, idx) => (
          <g key={idx}>
            <circle
              cx={tree.tx}
              cy={tree.ty}
              r="12"
              fill="#DCFCE7"
              stroke="#16A34A"
              strokeWidth="1.5"
            />
            <circle cx={tree.tx} cy={tree.ty} r="3" fill="#15803D" />
          </g>
        ))}
      </g>
    );
  }

  // 4. ENTRANCE & EXIT GATES — Gatehouse pillars, road barrier arm & directional lane arrows
  if (type === 'entrance' || type === 'exit') {
    return (
      <g className="pointer-events-none">
        {/* Gate pillars */}
        <rect x={x + 4} y={y + 4} width="10" height={h - 8} rx="2" fill="#FB923C" />
        <rect x={x + w - 14} y={y + 4} width="10" height={h - 8} rx="2" fill="#FB923C" />
        {/* Boom barrier striped bar */}
        <line
          x1={x + 14}
          y1={y + h - 7}
          x2={x + w - 14}
          y2={y + h - 7}
          stroke="#FDBA74"
          strokeWidth="3"
          strokeDasharray="6 4"
        />
      </g>
    );
  }

  // 5. TOILETS / RESTROOMS — Tiled floor grid, restroom stalls & washbasin counter
  if (type === 'toilet') {
    const stallCount = Math.max(2, Math.min(4, Math.floor(iw / 20)));
    const stallW = (iw - 8) / stallCount;
    return (
      <g className="pointer-events-none">
        {/* Restroom stalls along top wall */}
        {Array.from({ length: stallCount }).map((_, idx) => {
          const sx = ix + idx * stallW;
          return (
            <g key={idx}>
              <rect
                x={sx}
                y={iy}
                width={stallW - 2}
                height={ih * 0.45}
                fill={palette.floorAccent}
                stroke={palette.fixtureStroke}
                strokeWidth="1"
              />
              {/* WC fixture oval */}
              <ellipse
                cx={sx + (stallW - 2) / 2}
                cy={iy + ih * 0.22}
                rx="3.5"
                ry="5"
                fill="#FFFFFF"
                stroke={palette.fixtureStroke}
                strokeWidth="1"
              />
            </g>
          );
        })}
        {/* Sink washbasin counter along bottom wall */}
        <rect
          x={ix + 4}
          y={iy + ih - 12}
          width={iw - 8}
          height="10"
          rx="2"
          fill="#FFFFFF"
          stroke={palette.fixtureStroke}
          strokeWidth="1"
        />
        {[0.25, 0.5, 0.75].map((pos, i) => (
          <circle
            key={i}
            cx={ix + iw * pos}
            cy={iy + ih - 7}
            r="3"
            fill={palette.floorAccent}
            stroke={palette.fixtureStroke}
            strokeWidth="0.8"
          />
        ))}
      </g>
    );
  }

  // 6. COMPUTER / ICT LABORATORIES — Workstation rows with monitors & server rack
  if (type === 'laboratory') {
    const cols = Math.max(2, Math.min(5, Math.floor(iw / 24)));
    const rows = Math.max(2, Math.min(3, Math.floor(ih / 22)));
    const colStep = iw / cols;
    const rowStep = (ih - 10) / rows;

    return (
      <g className="pointer-events-none">
        {/* Front Projector / Smartboard on wall */}
        <rect
          x={ix + iw * 0.2}
          y={y + 2.5}
          width={iw * 0.6}
          height="3"
          rx="1"
          fill="#38BDF8"
        />
        {/* Computer Lab Workstation Desks */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const dx = ix + c * colStep + 3;
            const dy = iy + 8 + r * rowStep;
            const dw = Math.max(10, colStep - 6);
            return (
              <g key={`pc-${r}-${c}`}>
                {/* Desk */}
                <rect
                  x={dx}
                  y={dy}
                  width={dw}
                  height="9"
                  rx="1.5"
                  fill={palette.fixtureFill}
                  stroke={palette.fixtureStroke}
                  strokeWidth="1"
                />
                {/* Computer monitor bar */}
                <rect
                  x={dx + 2}
                  y={dy + 1.5}
                  width={Math.max(4, dw - 4)}
                  height="2.5"
                  fill={palette.wallOuter}
                />
                {/* Chair */}
                <circle
                  cx={dx + dw / 2}
                  cy={dy + 12}
                  r="2.2"
                  fill={palette.fixtureStroke}
                />
              </g>
            );
          })
        )}
      </g>
    );
  }

  // 7. WORKSHOPS — Heavy industrial workbenches, machinery bays & tool tables
  if (type === 'workshop') {
    const benchCount = Math.max(2, Math.min(5, Math.floor(iw / 42)));
    const benchW = (iw - 8) / benchCount;
    return (
      <g className="pointer-events-none">
        {/* Safety hazard floor border */}
        <rect
          x={ix + 2}
          y={iy + 2}
          width={iw - 4}
          height={ih - 4}
          fill="none"
          stroke={palette.fixtureStroke}
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity="0.6"
        />
        {/* Heavy Workbenches / Service Bays */}
        {Array.from({ length: benchCount }).map((_, idx) => {
          const bx = ix + 4 + idx * benchW + 3;
          const bw = Math.max(14, benchW - 6);
          return (
            <g key={idx}>
              <rect
                x={bx}
                y={iy + 8}
                width={bw}
                height={Math.max(16, ih - 16)}
                rx="2"
                fill={palette.fixtureFill}
                stroke={palette.fixtureStroke}
                strokeWidth="1.2"
              />
              {/* Cross-brace / machine detail */}
              <line
                x1={bx + 3}
                y1={iy + 12}
                x2={bx + bw - 3}
                y2={iy + 12}
                stroke={palette.fixtureStroke}
                strokeWidth="1.2"
              />
              <line
                x1={bx + 3}
                y1={iy + ih - 12}
                x2={bx + bw - 3}
                y2={iy + ih - 12}
                stroke={palette.fixtureStroke}
                strokeWidth="1.2"
              />
            </g>
          );
        })}
      </g>
    );
  }

  // 8. OFFICES & BOARD ROOM — Executive desks, chairs & conference tables
  if (type === 'office') {
    if (id === 'board-room') {
      return (
        <g className="pointer-events-none">
          {/* Conference table */}
          <rect
            x={ix + 6}
            y={iy + 8}
            width={iw - 12}
            height={ih - 16}
            rx="8"
            fill={palette.fixtureFill}
            stroke={palette.fixtureStroke}
            strokeWidth="1.5"
          />
        </g>
      );
    }
    return (
      <g className="pointer-events-none">
        {/* L-shaped executive office desk */}
        <path
          d={`M ${ix + 4} ${iy + 4} H ${ix + iw * 0.65} V ${iy + 14} H ${
            ix + 14
          } V ${iy + ih * 0.65} H ${ix + 4} Z`}
          fill={palette.fixtureFill}
          stroke={palette.fixtureStroke}
          strokeWidth="1.1"
        />
        {/* Executive chair */}
        <circle
          cx={ix + iw * 0.4}
          cy={iy + 20}
          r="3.5"
          fill={palette.fixtureStroke}
        />
      </g>
    );
  }

  // 9. LIBRARY — Parallel Bookshelf Stacks & Reading Tables
  if (id === 'library') {
    return (
      <g className="pointer-events-none">
        {[0, 1, 2, 3].map((shelf) => (
          <rect
            key={shelf}
            x={ix + 4 + shelf * ((iw - 8) / 4)}
            y={iy + 4}
            width="10"
            height={ih * 0.42}
            rx="1"
            fill={palette.fixtureFill}
            stroke={palette.fixtureStroke}
            strokeWidth="1"
          />
        ))}
        {/* Reading table */}
        <rect
          x={ix + 8}
          y={iy + ih * 0.6}
          width={iw - 16}
          height="14"
          rx="2"
          fill="#FFFFFF"
          stroke={palette.fixtureStroke}
          strokeWidth="1"
        />
      </g>
    );
  }

  // 10. HALLS & KITCHEN — Dining tables / Kitchen counters
  if (type === 'hall' || type === 'kitchen') {
    const tables = Math.max(2, Math.min(4, Math.floor(iw / 28)));
    const tStep = iw / tables;
    return (
      <g className="pointer-events-none">
        {Array.from({ length: tables }).map((_, idx) => (
          <rect
            key={idx}
            x={ix + idx * tStep + 3}
            y={iy + 3}
            width={Math.max(10, tStep - 6)}
            height={Math.max(8, ih - 6)}
            rx="2"
            fill={palette.fixtureFill}
            stroke={palette.fixtureStroke}
            strokeWidth="1"
          />
        ))}
      </g>
    );
  }

  // 11. DEFAULT: REAL CLASSROOM LAYOUT (Chalkboard/Whiteboard, Teacher Desk & Student Desks Grid)
  const cols = Math.max(2, Math.min(4, Math.floor(iw / 18)));
  const rows = Math.max(2, Math.min(3, Math.floor((ih - 10) / 15)));
  const colW = iw / cols;
  const rowH = Math.max(10, (ih - 10) / rows);

  return (
    <g className="pointer-events-none">
      {/* Classroom Teaching Board mounted on North Wall */}
      <rect
        x={x + w * 0.22}
        y={y + 2.5}
        width={w * 0.56}
        height="3"
        rx="1"
        fill={palette.wallOuter}
      />
      {/* Teacher's Desk in Front Corner */}
      {iw >= 36 && ih >= 32 && (
        <rect
          x={ix + 2}
          y={iy + 3}
          width="12"
          height="6"
          rx="1"
          fill={palette.wallInner}
          opacity="0.7"
        />
      )}
      {/* Rows & Columns of Student Classroom Desks + Chairs */}
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const dx = ix + c * colW + 2.5;
          const dy = iy + 10 + r * rowH;
          const dw = Math.max(7, colW - 5);
          if (dy + 7 > y + h - 4) return null;
          return (
            <g key={`desk-${r}-${c}`}>
              {/* Student Desk */}
              <rect
                x={dx}
                y={dy}
                width={dw}
                height="5.5"
                rx="1"
                fill={palette.fixtureFill}
                stroke={palette.fixtureStroke}
                strokeWidth="0.9"
              />
              {/* Student Seat */}
              <rect
                x={dx + dw * 0.2}
                y={dy + 6.5}
                width={dw * 0.6}
                height="2"
                rx="0.8"
                fill={palette.fixtureStroke}
                opacity="0.75"
              />
            </g>
          );
        })
      )}
    </g>
  );
};
