import { nanoid } from 'nanoid';
import type { Diagram, NodeBase } from './types';
import { buildEdge } from './modelUtils';

const createNode = (partial: Partial<NodeBase> & Pick<NodeBase, 'type' | 'x' | 'y'>): NodeBase => ({
  id: partial.id ?? nanoid(),
  type: partial.type,
  name: partial.name ?? '',
  x: partial.x,
  y: partial.y,
  width: partial.width ?? 140,
  height: partial.height ?? 80,
  laneId: partial.laneId,
  poolId: partial.poolId,
  documentation: partial.documentation ?? '',
  properties: partial.properties ?? {},
});

export const createInitialDiagram = (): Diagram => {
  const poolId = nanoid();
  const laneId = nanoid();

  const pool = createNode({
    id: poolId,
    type: 'pool',
    name: 'Processo Principal',
    x: 120,
    y: 120,
    width: 900,
    height: 420,
    properties: { participantName: 'Acme Corp', orientation: 'horizontal' },
  });

  const lane = createNode({
    id: laneId,
    type: 'lane',
    name: 'Equipe A',
    x: pool.x + 40,
    y: pool.y + 40,
    width: pool.width - 60,
    height: pool.height - 60,
    poolId,
    properties: { laneName: 'Equipe A' },
  });

  const start = createNode({
    type: 'startEvent',
    x: lane.x + 80,
    y: lane.y + 140,
    width: 60,
    height: 60,
    name: 'Start',
    poolId,
    laneId,
    properties: { eventType: 'start' },
  });

  const task = createNode({
    type: 'task',
    x: lane.x + 220,
    y: lane.y + 120,
    width: 160,
    height: 100,
    name: 'Analisar pedido',
    poolId,
    laneId,
    properties: { taskType: 'generic' },
  });

  const end = createNode({
    type: 'endEvent',
    x: lane.x + 450,
    y: lane.y + 140,
    width: 60,
    height: 60,
    name: 'Fim',
    poolId,
    laneId,
    properties: { eventType: 'end' },
  });

  const edge1 = buildEdge(start, task, 'sequence');
  const edge2 = buildEdge(task, end, 'sequence');

  return {
    nodes: [pool, lane, start, task, end],
    edges: [edge1, edge2],
    metadata: {
      name: 'Processo inicial',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
};
