import type { Diagram } from '../model/types';
import { routeEdge } from '../render/edgeRouting';

const renderNode = (node: Diagram['nodes'][number]) => {
  if (node.type === 'startEvent' || node.type === 'endEvent') {
    const strokeWidth = node.type === 'endEvent' ? 3 : 2;
    return `<circle cx="${node.x + node.width / 2}" cy="${node.y + node.height / 2}" r="${
      node.width / 2
    }" fill="white" stroke="#1f2937" stroke-width="${strokeWidth}" />`;
  }
  if (node.type === 'exclusiveGateway' || node.type === 'parallelGateway') {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const size = node.width / 2;
    const points = [
      `${cx} ${cy - size}`,
      `${cx + size} ${cy}`,
      `${cx} ${cy + size}`,
      `${cx - size} ${cy}`,
    ].join(' ');
    return `<polygon points="${points}" fill="white" stroke="#1f2937" stroke-width="2" />`;
  }
  if (node.type === 'pool' || node.type === 'lane') {
    return `<rect x="${node.x}" y="${node.y}" width="${node.width}" height="${node.height}" fill="white" stroke="#94a3b8" stroke-width="2" />`;
  }
  return `<rect x="${node.x}" y="${node.y}" rx="12" ry="12" width="${node.width}" height="${node.height}" fill="white" stroke="#1f2937" stroke-width="2" />`;
};

const renderEdge = (diagram: Diagram, edge: Diagram['edges'][number]) => {
  const source = diagram.nodes.find((node) => node.id === edge.sourceId);
  const target = diagram.nodes.find((node) => node.id === edge.targetId);
  if (!source || !target) {
    return '';
  }
  const waypoints = edge.waypoints.length ? edge.waypoints : routeEdge(source, target);
  const path = waypoints.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${
    point.y
  }`).join(' ');
  const strokeDasharray = edge.type === 'message' ? '6 4' : edge.type === 'association' ? '3 3' : '0';
  return `<path d="${path}" fill="none" stroke="#1f2937" stroke-width="2" stroke-dasharray="${strokeDasharray}" />`;
};

export const exportDiagramSvg = (diagram: Diagram) => {
  const bounds = diagram.nodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.x),
      minY: Math.min(acc.minY, node.y),
      maxX: Math.max(acc.maxX, node.x + node.width),
      maxY: Math.max(acc.maxY, node.y + node.height),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );

  const width = Math.max(800, bounds.maxX - bounds.minX + 200);
  const height = Math.max(600, bounds.maxY - bounds.minY + 200);
  const offsetX = bounds.minX - 100;
  const offsetY = bounds.minY - 100;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${offsetX} ${offsetY} ${width} ${height}">
  <rect width="100%" height="100%" fill="#f8fafc" />
  ${diagram.edges.map((edge) => renderEdge(diagram, edge)).join('\n')}
  ${diagram.nodes.map((node) => renderNode(node)).join('\n')}
</svg>`;
};
