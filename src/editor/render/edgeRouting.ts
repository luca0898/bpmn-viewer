import { getCenter } from '../model/geometry';
import type { NodeBase } from '../model/types';

export const routeEdge = (source: NodeBase, target: NodeBase) => {
  const start = getCenter(source);
  const end = getCenter(target);

  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  if (Math.abs(start.x - end.x) > Math.abs(start.y - end.y)) {
    return [
      { x: start.x, y: start.y },
      { x: midX, y: start.y },
      { x: midX, y: end.y },
      { x: end.x, y: end.y },
    ];
  }

  return [
    { x: start.x, y: start.y },
    { x: start.x, y: midY },
    { x: end.x, y: midY },
    { x: end.x, y: end.y },
  ];
};

export const routeEdgeLine = (source: NodeBase, target: NodeBase) => {
  const start = getCenter(source);
  const end = getCenter(target);
  return [start, end];
};
