# CampusVector — Interactive School Map & Indoor/Outdoor Navigation

A standalone React + TypeScript + Vite web application providing a digitized interactive vector map of the two-page hand-drawn school campus PDF, a structured location database (`locations.json`), a walkable path graph (`paths.json`), and Dijkstra shortest-path route navigation.

---

## Features

1. **Pure Vector Digital Map (`src/map/CampusMap.tsx`)**
   - Recreates both pages of the source campus PDF using clean SVG buildings, individual rooms, internal blue corridor arrows, walkways, entrances, exits, fields, mosque, workshops, labs, offices, and toilets.
   - Separated building shells for the three large purple building complexes (`Building A`, `Building B`, `Building C`) and all classroom/administrative blocks.
   - Every room and landmark is individually clickable and searchable.
   - Switch between **Full Campus (Page 1 + Page 2)**, **Page 1: Main & Academic Wing**, and **Page 2: Gate & Engineering Wing**.

2. **Structured Location Database (`src/data/locations.json`)**
   - Contains 78 digitized rooms and landmarks with `id`, `name`, `shortLabel`, `type`, `building`, `sheet`, `x`, `y`, `width`, `height`, and walkable node `connections`.
   - Unclear handwritten labels and unlabeled compartments are explicitly prefixed with `"UNCONFIRMED: [best visual reading]"` and can be edited live inside the built-in **Label Verification & Editor** modal.

3. **Strict Approved Red Route Navigation Network (`src/data/routeNodes.json`, `src/data/routeConnections.json`, `src/navigation/dijkstra.ts`)**
   - Uses exclusively the manually defined red walking routes and mapped room access points (`routeNodes.json` + `routeConnections.json`).
   - Enforces the mathematical invariant `ACTIVE_NAVIGATION_ROUTE ⊆ APPROVED_RED_ROUTE_NETWORK` via `validateRouteAgainstApprovedNetwork` before any route is rendered.
   - Never creates free-space shortcuts, never cuts through buildings or classrooms (e.g., H4 to H5 strictly routes around H6 via the approved red network to H5's west entrance), and never connects nodes by proximity.
   - If a destination has no mapped connection on the approved red network, displays: `"No approved walking route is mapped to this destination."`

4. **Zero Cloud / AI API Dependency**
   - Runs 100% locally from static JSON data files (`locations.json`, `routeNodes.json`, `routeConnections.json`, `buildings.json`).
   - Ready to deploy for free to Vercel, Netlify, GitHub Pages, or Firebase Hosting.

---

## Running Locally in VS Code

1. Extract the downloaded project ZIP file.
2. Open the project folder in **VS Code**.
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the local development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` (or `http://localhost:5173`) in your browser.

---

## Unconfirmed / Unlabeled Locations for Review

The following locations had ambiguous handwriting or no label on the source PDF and are marked with `UNCONFIRMED:` so you can easily review and rename them:

### Page 1 (Main & Academic Wing)
- `UNCONFIRMED: H9` — Room between H10 and H8 (handwriting resembles `H9` or `H4`; sequential order H10–H9–H8–H7 indicates `H9`).
- `UNCONFIRMED: H10 Upper Bay`, `H9 Upper Bay`, `H8 Upper Bay`, `H7 Upper Bay` — Four unlabeled compartments in the top half of the H10–H7 block.
- `UNCONFIRMED: C$A1 (H1–H4 East End)` — Narrow compartment at the right end of the H1–H4 block labeled vertically `C $ A1`.
- `UNCONFIRMED: G4 (Dark Blue Block)` — Dark blue square below G1 labeled `G4` in red (duplicate of `G4` in the pink G1–G4 block).
- `UNCONFIRMED: C$A1 (Yellow Block)`, `Yellow Block Middle Room`, `C$A2` — Three compartments in the yellow block below the blue G4 square.
- `UNCONFIRMED: Hospitality Building Main Section` & `Hospitality South Bay` — Unlabeled grey compartments to the left of `Accommodation` and `HOD Hospitality`.
- `UNCONFIRMED: Assessment Office / Service Point` — Small red handwriting over the purple rectangle above `Procurement` (`Assessment office / Service point`).
- `UNCONFIRMED: Unlabeled Blue Room (Next to Procurement)` — Blue square between `Procurement` and `Board Room`.
- `UNCONFIRMED: A4 / HOD Fashion` — Written in three lines as `A4 / HOD / Fashio` inside Building A.
- `UNCONFIRMED: Building A Unlabeled Rooms` — 8 unlabeled compartments inside Purple Building A (top-left, top-right, middle-center, 2 middle-east, 3 bottom-row east of Clothing Technology).
- `UNCONFIRMED: Far-East Yellow Block` — Unlabeled vertical yellow block on the far right edge of Page 1.
- `UNCONFIRMED: Teal Block East of D8` — Unlabeled teal square immediately east of `D8`.
- `UNCONFIRMED: K-Block East Room 1 & 2` — Two unlabeled red-brown rooms to the right of `K1`.

### Page 2 (Gate, Field, Maintenance & Engineering Wing)
- `UNCONFIRMED: HOD Repaire/mai (Repair & Maintenance)` — Cropped at the right edge of the Maintenance column.
- `UNCONFIRMED: Mutesy office` — Handwritten below HOD Repaire/mai as `Mutesy office` (or `Mutesu office`).
- `UNCONFIRMED: Unlabeled Room Above Dispensary` — Grey compartment between Mutesy office and Dispensary.
- `UNCONFIRMED: Building B - Top-Right Room` — Unlabeled compartment east of `C2 / EB2`.
- `UNCONFIRMED: HOD COMP` — Stacked handwriting `HOD / COM / P` in the middle-left of Building B.
- `UNCONFIRMED: Jit-ume (Jitume Lab)` — Hyphenated handwriting `Jit- / ume` next to HOD COMP.
- `UNCONFIRMED: Electrical Worksh EW` — Handwritten `electrical / worksh / EW` between Building & Civil and Guidance & Counselling.
- `UNCONFIRMED: EW (Electrical Wing South)` — Bottom-center room of Building B labeled `EW`.
- `UNCONFIRMED: Building C - Upper & Lower Purple Wings` — Third large purple building at the bottom of Page 2, split by a horizontal blue corridor arrow with no room labels.
