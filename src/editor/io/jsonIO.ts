import type { Diagram, NodeBase } from '../model/types';
import { createNode } from '../model/nodeFactory';

const pickContainer = (nodes: NodeBase[]) => {
  const lane = nodes.find((node) => node.type === 'lane');
  if (lane) {
    return lane;
  }
  const pool = nodes.find((node) => node.type === 'pool');
  return pool;
};

const ensureStartEnd = (diagram: Diagram): Diagram => {
  const startNodes = diagram.nodes.filter((node) => node.type === 'startEvent');
  const endNodes = diagram.nodes.filter((node) => node.type === 'endEvent');
  const keepStart = startNodes[0];
  const keepEnd = endNodes[0];
  const removedIds = new Set<string>();
  startNodes.slice(1).forEach((node) => removedIds.add(node.id));
  endNodes.slice(1).forEach((node) => removedIds.add(node.id));

  let nodes = diagram.nodes.filter((node) => !removedIds.has(node.id));
  let edges = diagram.edges.filter(
    (edge) => !removedIds.has(edge.sourceId) && !removedIds.has(edge.targetId),
  );

  if (!keepStart) {
    const container = pickContainer(nodes);
    const position = container
      ? { x: container.x + 80, y: container.y + 120 }
      : { x: 160, y: 160 };
    const start = createNode('startEvent', position, {
      poolId: container?.type === 'pool' ? container.id : container?.poolId,
      laneId: container?.type === 'lane' ? container.id : undefined,
      properties: { eventType: 'start' },
    });
    nodes = [...nodes, start];
  }

  if (!keepEnd) {
    const container = pickContainer(nodes);
    const position = container
      ? { x: container.x + container.width - 140, y: container.y + 120 }
      : { x: 460, y: 160 };
    const end = createNode('endEvent', position, {
      poolId: container?.type === 'pool' ? container.id : container?.poolId,
      laneId: container?.type === 'lane' ? container.id : undefined,
      properties: { eventType: 'end' },
    });
    nodes = [...nodes, end];
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  edges = edges.filter((edge) => nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId));

  const startNode = nodes.find((node) => node.type === 'startEvent');
  if (startNode) {
    const outgoing = edges.filter(
      (edge) => edge.sourceId === startNode.id && edge.type === 'sequence',
    );
    if (outgoing.length > 1) {
      const keepEdge = outgoing[0];
      edges = edges.filter(
        (edge) =>
          edge.sourceId !== startNode.id ||
          edge.type !== 'sequence' ||
          edge.id === keepEdge.id,
      );
    }
  }

  return {
    ...diagram,
    nodes,
    edges,
  };
};

export const exportDiagramJson = (diagram: Diagram) =>
  JSON.stringify(diagram, null, 2);

export const importDiagramJson = (raw: string): Diagram =>
  ensureStartEnd(JSON.parse(raw) as Diagram);
