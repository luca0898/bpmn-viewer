export type NodeType =
  | 'startEvent'
  | 'endEvent'
  | 'task'
  | 'userTask'
  | 'serviceTask'
  | 'exclusiveGateway'
  | 'parallelGateway'
  | 'pool'
  | 'lane'
  | 'subprocess'
  | 'textAnnotation'
  | 'dataObject';

export type EdgeType = 'sequence' | 'message' | 'association';

export type DiagramMetadata = {
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type NodeProperties = {
  taskType?: 'generic' | 'user' | 'service';
  assignee?: string;
  candidateGroups?: string[];
  implementation?: string;
  topic?: string;
  eventType?: 'start' | 'end' | 'timer' | 'message';
  timerDefinition?: string;
  messageName?: string;
  gatewayType?: 'xor' | 'and';
  collapsed?: boolean;
  participantName?: string;
  laneName?: string;
  orientation?: 'horizontal' | 'vertical';
};

export type NodeBase = {
  id: string;
  type: NodeType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string;
  laneId?: string;
  poolId?: string;
  documentation?: string;
  properties: NodeProperties;
};

export type EdgeBase = {
  id: string;
  type: EdgeType;
  sourceId: string;
  targetId: string;
  waypoints: Array<{ x: number; y: number }>;
  label?: string;
  condition?: string;
  isDefault?: boolean;
};

export type Diagram = {
  nodes: NodeBase[];
  edges: EdgeBase[];
  metadata: DiagramMetadata;
};

export type Selection = {
  ids: string[];
  type: 'node' | 'edge' | 'none';
};

export type Viewport = {
  x: number;
  y: number;
  scale: number;
};
