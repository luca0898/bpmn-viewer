import { nanoid } from 'nanoid';
import type { Diagram, EdgeBase, EdgeType, NodeBase } from './types';
import { routeEdge } from '../render/edgeRouting';

export const buildEdge = (source: NodeBase, target: NodeBase, type: EdgeType): EdgeBase => ({
  id: nanoid(),
  type,
  sourceId: source.id,
  targetId: target.id,
  waypoints: routeEdge(source, target),
});

export const getNodeById = (diagram: Diagram, id: string) =>
  diagram.nodes.find((node) => node.id === id);

export const getEdgeById = (diagram: Diagram, id: string) =>
  diagram.edges.find((edge) => edge.id === id);

export const getConnectedEdges = (diagram: Diagram, nodeId: string) =>
  diagram.edges.filter((edge) => edge.sourceId === nodeId || edge.targetId === nodeId);

export const getPoolForNode = (diagram: Diagram, node: NodeBase) => {
  if (node.type === 'pool') {
    return node;
  }
  if (node.poolId) {
    return getNodeById(diagram, node.poolId);
  }
  return undefined;
};

export const getLaneForNode = (diagram: Diagram, node: NodeBase) => {
  if (node.type === 'lane') {
    return node;
  }
  if (node.laneId) {
    return getNodeById(diagram, node.laneId);
  }
  return undefined;
};

export const updateEdgesForNodes = (diagram: Diagram, nodeIds: string[]) => {
  const nodesById = new Map(diagram.nodes.map((node) => [node.id, node]));
  return diagram.edges.map((edge) => {
    if (nodeIds.includes(edge.sourceId) || nodeIds.includes(edge.targetId)) {
      const source = nodesById.get(edge.sourceId);
      const target = nodesById.get(edge.targetId);
      if (source && target) {
        return { ...edge, waypoints: routeEdge(source, target) };
      }
    }
    return edge;
  });
};
