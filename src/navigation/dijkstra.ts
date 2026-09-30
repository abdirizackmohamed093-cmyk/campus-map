import {
  CalculatedRoute,
  CampusLocation,
  RouteConnection,
  RouteNode,
  RouteResult,
  RouteStep,
} from '../types/campus';

function euclideanDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Validates that EVERY consecutive segment in `nodeIds` exists in the official
 * `routeConnections.json` network.
 *
 * Mathematical guarantee:
 * ACTIVE_NAVIGATION_ROUTE ⊆ APPROVED_RED_ROUTE_NETWORK
 * If even ONE segment is outside `routeConnections`, the entire route is rejected.
 */
export function validateRouteAgainstApprovedNetwork(
  nodeIds: string[],
  routeConnections: RouteConnection[]
): { valid: boolean; connectionIds: string[] } {
  if (nodeIds.length === 0) {
    return { valid: false, connectionIds: [] };
  }
  if (nodeIds.length === 1) {
    return { valid: true, connectionIds: [] };
  }

  const connectionLookup = new Map<string, string>();
  for (const conn of routeConnections) {
    const fwdKey = `${conn.from}__${conn.to}`;
    const revKey = `${conn.to}__${conn.from}`;
    connectionLookup.set(fwdKey, conn.id);
    connectionLookup.set(revKey, conn.id);
  }

  const usedConnectionIds: string[] = [];
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const a = nodeIds[i];
    const b = nodeIds[i + 1];
    const key = `${a}__${b}`;
    const connId = connectionLookup.get(key);
    if (!connId) {
      // Unauthorized segment detected -> Reject entire route immediately
      return { valid: false, connectionIds: [] };
    }
    usedConnectionIds.push(connId);
  }

  return { valid: true, connectionIds: usedConnectionIds };
}

/**
 * Calculates a route strictly along the manually defined red route network (`routeNodes` + `routeConnections`).
 * Never creates free-space shortcuts, never routes through rooms, and never connects nodes by proximity.
 */
export function calculateApprovedRedRoute(
  start:
    | { type: 'location'; locationId: string }
    | { type: 'node'; nodeId: string; label?: string },
  destinationId: string,
  locations: CampusLocation[],
  routeNodes: RouteNode[],
  routeConnections: RouteConnection[]
): RouteResult {
  const NO_ROUTE_MSG = 'No approved walking route is mapped to this destination.';

  const destinationLoc = locations.find((l) => l.id === destinationId);
  if (!destinationLoc) {
    return { status: 'no-route', message: NO_ROUTE_MSG };
  }

  // Destination must have an explicit mapped access node on the approved red network
  if (!destinationLoc.connections || destinationLoc.connections.length === 0) {
    return { status: 'no-route', message: NO_ROUTE_MSG };
  }

  const nodeMap = new Map<string, RouteNode>();
  for (const rn of routeNodes) {
    nodeMap.set(rn.id, rn);
  }

  const destAccessIds = destinationLoc.connections.filter((id) => nodeMap.has(id));
  if (destAccessIds.length === 0) {
    return { status: 'no-route', message: NO_ROUTE_MSG };
  }

  // Resolve start access node(s) on the approved red network
  let startAccessIds: string[] = [];
  let startDisplayName = '';

  if (start.type === 'location') {
    const startLoc = locations.find((l) => l.id === start.locationId);
    if (!startLoc || !startLoc.connections || startLoc.connections.length === 0) {
      return { status: 'no-route', message: NO_ROUTE_MSG };
    }
    startAccessIds = startLoc.connections.filter((id) => nodeMap.has(id));
    if (startAccessIds.length === 0) {
      return { status: 'no-route', message: NO_ROUTE_MSG };
    }
    startDisplayName = startLoc.name.replace(/^UNCONFIRMED:\s*/i, '');

    if (start.locationId === destinationId) {
      const accessNode = nodeMap.get(destAccessIds[0])!;
      return {
        status: 'ok',
        route: {
          points: [
            {
              x: accessNode.x,
              y: accessNode.y,
              id: accessNode.id,
              label: destinationLoc.name,
            },
          ],
          steps: [
            {
              id: accessNode.id,
              instruction: `You are at ${destinationLoc.name.replace(
                /^UNCONFIRMED:\s*/i,
                ''
              )} entrance`,
              distanceUnits: 0,
              x: accessNode.x,
              y: accessNode.y,
              nodeType: 'destination',
            },
          ],
          totalDistanceMeters: 0,
          estimatedMinutes: 0,
          validated: true,
          approvedConnectionIds: [],
        },
      };
    }
  } else {
    if (!nodeMap.has(start.nodeId)) {
      return { status: 'no-route', message: NO_ROUTE_MSG };
    }
    startAccessIds = [start.nodeId];
    const startNode = nodeMap.get(start.nodeId)!;
    startDisplayName = start.label || startNode.name;
  }

  // Build strict adjacency list ONLY from routeConnections.json
  const adjacency = new Map<string, { neighborId: string; weight: number; connId: string }[]>();
  for (const rn of routeNodes) {
    adjacency.set(rn.id, []);
  }

  for (const conn of routeConnections) {
    const nA = nodeMap.get(conn.from);
    const nB = nodeMap.get(conn.to);
    if (!nA || !nB) continue;
    const dist = euclideanDistance(nA.x, nA.y, nB.x, nB.y);
    adjacency.get(nA.id)!.push({ neighborId: nB.id, weight: dist, connId: conn.id });
    adjacency.get(nB.id)!.push({ neighborId: nA.id, weight: dist, connId: conn.id });
  }

  // Run Dijkstra exclusively over the approved red route graph
  const distances = new Map<string, number>();
  const previous = new Map<string, string | null>();
  const unvisited = new Set<string>();

  for (const rn of routeNodes) {
    distances.set(rn.id, Infinity);
    previous.set(rn.id, null);
    unvisited.add(rn.id);
  }

  for (const sId of startAccessIds) {
    distances.set(sId, 0);
  }

  const destTargetSet = new Set<string>(destAccessIds);
  let reachedDestAccessId: string | null = null;

  while (unvisited.size > 0) {
    let currentId: string | null = null;
    let smallestDist = Infinity;

    for (const id of unvisited) {
      const d = distances.get(id) ?? Infinity;
      if (d < smallestDist) {
        smallestDist = d;
        currentId = id;
      }
    }

    if (currentId === null || smallestDist === Infinity) break;
    if (destTargetSet.has(currentId)) {
      reachedDestAccessId = currentId;
      break;
    }

    unvisited.delete(currentId);
    const neighbors = adjacency.get(currentId) || [];

    for (const edge of neighbors) {
      if (!unvisited.has(edge.neighborId)) continue;
      const alt = smallestDist + edge.weight;
      if (alt < (distances.get(edge.neighborId) ?? Infinity)) {
        distances.set(edge.neighborId, alt);
        previous.set(edge.neighborId, currentId);
      }
    }
  }

  if (!reachedDestAccessId) {
    return { status: 'no-route', message: NO_ROUTE_MSG };
  }

  // Reconstruct node sequence
  const nodePath: string[] = [];
  let curr: string | null = reachedDestAccessId;
  while (curr !== null) {
    nodePath.unshift(curr);
    curr = previous.get(curr) ?? null;
  }

  if (nodePath.length === 0 || !startAccessIds.includes(nodePath[0])) {
    return { status: 'no-route', message: NO_ROUTE_MSG };
  }

  // MANDATORY VALIDATION STEP: Verify every single segment against routeConnections.json
  const validation = validateRouteAgainstApprovedNetwork(nodePath, routeConnections);
  if (!validation.valid) {
    return { status: 'no-route', message: NO_ROUTE_MSG };
  }

  // Build route points and human-readable steps strictly from the validated red route nodes
  const points = nodePath.map((id) => {
    const rn = nodeMap.get(id)!;
    return { x: rn.x, y: rn.y, id: rn.id, label: rn.name };
  });

  const steps: RouteStep[] = [];
  let totalRawUnits = 0;
  const cleanDestName = destinationLoc.name.replace(/^UNCONFIRMED:\s*/i, '');

  for (let i = 0; i < nodePath.length; i++) {
    const rn = nodeMap.get(nodePath[i])!;
    const prevRn = i > 0 ? nodeMap.get(nodePath[i - 1])! : null;
    const segDist = prevRn ? euclideanDistance(prevRn.x, prevRn.y, rn.x, rn.y) : 0;
    totalRawUnits += segDist;

    let instruction = rn.name;
    if (i === 0) {
      instruction = `Start at ${startDisplayName} (${rn.name})`;
    } else if (i === nodePath.length - 1) {
      instruction = `Enter ${cleanDestName} via ${rn.name}`;
    } else if (rn.kind === 'corridor') {
      instruction = `Follow building corridor: ${rn.name}`;
    } else {
      instruction = `Follow red route: ${rn.name}`;
    }

    steps.push({
      id: rn.id,
      connectionId: i > 0 ? validation.connectionIds[i - 1] : undefined,
      instruction,
      distanceUnits: Math.round(segDist * 0.18),
      x: rn.x,
      y: rn.y,
      nodeType:
        i === 0
          ? 'start'
          : i === nodePath.length - 1
          ? 'destination'
          : rn.kind === 'corridor'
          ? 'corridor'
          : 'path',
    });
  }

  const totalDistanceMeters = Math.max(5, Math.round(totalRawUnits * 0.18));
  const estimatedMinutes = Math.max(1, Math.round(totalDistanceMeters / 70));

  return {
    status: 'ok',
    route: {
      points,
      steps,
      totalDistanceMeters,
      estimatedMinutes,
      validated: true,
      approvedConnectionIds: validation.connectionIds,
    },
  };
}

/**
 * When the user taps the map in "Set my location" mode, snaps their tap to the
 * nearest node on the Approved Red Route Network so their position is on a legitimate walkway.
 */
export function snapTapToApprovedRedNode(
  x: number,
  y: number,
  sheet: 1 | 2,
  routeNodes: RouteNode[]
): RouteNode {
  const sheetNodes = routeNodes.filter((n) => n.sheet === sheet);
  const pool = sheetNodes.length > 0 ? sheetNodes : routeNodes;
  return [...pool].sort(
    (a, b) => euclideanDistance(x, y, a.x, a.y) - euclideanDistance(x, y, b.x, b.y)
  )[0];
}
