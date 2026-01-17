import { nanoid } from 'nanoid';
import type { NodeBase, NodeType } from './types';

export const createNode = (
  type: NodeType,
  position: { x: number; y: number },
  overrides: Partial<NodeBase> = {},
): NodeBase => {
  const defaults: Record<NodeType, { width: number; height: number; name: string }> = {
    startEvent: { width: 60, height: 60, name: 'Start' },
    endEvent: { width: 60, height: 60, name: 'End' },
    task: { width: 160, height: 100, name: 'Task' },
    userTask: { width: 160, height: 100, name: 'User Task' },
    serviceTask: { width: 160, height: 100, name: 'Service Task' },
    exclusiveGateway: { width: 80, height: 80, name: 'XOR' },
    parallelGateway: { width: 80, height: 80, name: 'AND' },
    pool: { width: 800, height: 360, name: 'Pool' },
    lane: { width: 760, height: 160, name: 'Lane' },
    subprocess: { width: 180, height: 120, name: 'Subprocess' },
    textAnnotation: { width: 180, height: 80, name: 'Annotation' },
    dataObject: { width: 120, height: 80, name: 'Data' },
  };

  const base = defaults[type];
  return {
    id: overrides.id ?? nanoid(),
    type,
    name: overrides.name ?? base.name,
    x: position.x,
    y: position.y,
    width: overrides.width ?? base.width,
    height: overrides.height ?? base.height,
    laneId: overrides.laneId,
    poolId: overrides.poolId,
    documentation: overrides.documentation ?? '',
    properties: overrides.properties ?? {},
  };
};
