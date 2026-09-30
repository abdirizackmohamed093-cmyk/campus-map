import JSZip from 'jszip';
import { CampusLocation } from '../types/campus';

// Import raw project files so the exported ZIP is 100% complete and runnable in VS Code
import rawReadme from '../../README.md?raw';
import rawIndexHtml from '../../index.html?raw';
import rawTsConfig from '../../tsconfig.json?raw';
import rawMainTsx from '../main.tsx?raw';
import rawIndexCss from '../index.css?raw';
import rawCampusTypes from '../types/campus.ts?raw';
import rawPathsJson from '../data/paths.json?raw';
import rawRouteNodesJson from '../data/routeNodes.json?raw';
import rawRouteConnectionsJson from '../data/routeConnections.json?raw';
import rawBuildingsJson from '../data/buildings.json?raw';
import rawDijkstraTs from '../navigation/dijkstra.ts?raw';
import rawArchitecturalElementsTsx from '../map/ArchitecturalElements.tsx?raw';
import rawCampusMapTsx from '../map/CampusMap.tsx?raw';
import rawLabelEditorTsx from '../components/LabelEditorModal.tsx?raw';
import rawAppTsx from '../App.tsx?raw';
import rawSelfExportZip from './exportZip.ts?raw';

const STANDALONE_PACKAGE_JSON = `{
  "name": "campus-vector-navigation",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3000",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "jszip": "^3.10.1",
    "lucide-react": "^0.546.0",
    "react": "^19.0.1",
    "react-dom": "^19.0.1"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.3",
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.1",
    "tailwindcss": "^4.3.3",
    "typescript": "^5.8.2",
    "vite": "^6.2.0"
  }
}
`;

const STANDALONE_VITE_CONFIG = `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
`;

export async function downloadProjectZip(currentLocations: CampusLocation[]): Promise<void> {
  const zip = new JSZip();

  // Root config files
  zip.file('package.json', STANDALONE_PACKAGE_JSON);
  zip.file('README.md', rawReadme);
  zip.file('index.html', rawIndexHtml);
  zip.file('tsconfig.json', rawTsConfig);
  zip.file('vite.config.ts', STANDALONE_VITE_CONFIG);
  zip.file(
    '.gitignore',
    'node_modules\ndist\n.DS_Store\n*.local\n.env\n'
  );

  // Source files
  zip.file('src/main.tsx', rawMainTsx);
  zip.file('src/index.css', rawIndexCss);
  zip.file('src/App.tsx', rawAppTsx);
  zip.file('src/types/campus.ts', rawCampusTypes);

  // Data files (includes any live edits made to locations.json in the UI)
  zip.file('src/data/locations.json', JSON.stringify(currentLocations, null, 2));
  zip.file('src/data/paths.json', rawPathsJson);
  zip.file('src/data/routeNodes.json', rawRouteNodesJson);
  zip.file('src/data/routeConnections.json', rawRouteConnectionsJson);
  zip.file('src/data/buildings.json', rawBuildingsJson);

  // Navigation & Map Components
  zip.file('src/navigation/dijkstra.ts', rawDijkstraTs);
  zip.file('src/map/ArchitecturalElements.tsx', rawArchitecturalElementsTsx);
  zip.file('src/map/CampusMap.tsx', rawCampusMapTsx);
  zip.file('src/components/LabelEditorModal.tsx', rawLabelEditorTsx);
  zip.file('src/utils/exportZip.ts', rawSelfExportZip);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'campus-vector-navigation-source.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
