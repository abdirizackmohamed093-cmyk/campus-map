export type LocationType =
  | 'classroom'
  | 'laboratory'
  | 'workshop'
  | 'office'
  | 'toilet'
  | 'field'
  | 'mosque'
  | 'hall'
  | 'kitchen'
  | 'entrance'
  | 'exit'
  | 'landmark'
  | 'other';

export interface CampusLocation {
  id: string;
  name: string;
  shortLabel?: string;
  type: LocationType;
  building: string;
  sheet: 1 | 2;
  x: number;
  y: number;
  width: number;
  height: number;
  connections: string[];
  unconfirmed?: boolean;
  visualReading?: string;
  verificationNote?: string;
  colorScheme?:
    | 'purple'
    | 'blue-wood'
    | 'tan-wood'
    | 'white-outline'
    | 'pink'
    | 'dark-blue'
    | 'yellow'
    | 'grey'
    | 'orange'
    | 'peach'
    | 'green'
    | 'teal'
    | 'red-brown'
    | 'black-orange'
    | 'field';
}

export interface RouteNode {
  id: string;
  name: string;
  x: number;
  y: number;
  sheet: 1 | 2;
  kind: 'junction' | 'access' | 'corridor';
}

export interface RouteConnection {
  id: string;
  from: string;
  to: string;
  kind: 'red-arterial' | 'red-spur' | 'building-corridor';
}

export interface PathNode {
  id: string;
  name?: string;
  x: number;
  y: number;
  sheet: 1 | 2;
  kind?: 'outdoor' | 'corridor' | 'junction' | 'gate' | 'access';
  connections: string[];
}

export interface BuildingShell {
  id: string;
  name: string;
  sheet: 1 | 2;
  x: number;
  y: number;
  width: number;
  height: number;
  style:
    | 'purple-complex'
    | 'grey-complex'
    | 'classroom-row'
    | 'admin-cluster'
    | 'dining-cluster'
    | 'east-annex';
  corridors?: {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    bidirectional?: boolean;
  }[];
}

export interface RouteStep {
  id: string;
  connectionId?: string;
  instruction: string;
  distanceUnits: number;
  x: number;
  y: number;
  nodeType: 'start' | 'path' | 'corridor' | 'destination';
}

export interface CalculatedRoute {
  points: { x: number; y: number; id: string; label?: string }[];
  steps: RouteStep[];
  totalDistanceMeters: number;
  estimatedMinutes: number;
  validated: boolean;
  approvedConnectionIds: string[];
}

export type RouteResult =
  | { status: 'ok'; route: CalculatedRoute }
  | { status: 'no-route'; message: string };
