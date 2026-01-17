import type { Viewport } from './types';

export const GRID_SIZE = 20;

export const worldToScreen = (point: { x: number; y: number }, viewport: Viewport) => ({
  x: point.x * viewport.scale + viewport.x,
  y: point.y * viewport.scale + viewport.y,
});

export const screenToWorld = (point: { x: number; y: number }, viewport: Viewport) => ({
  x: (point.x - viewport.x) / viewport.scale,
  y: (point.y - viewport.y) / viewport.scale,
});

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const snapToGrid = (value: number, grid = GRID_SIZE) => Math.round(value / grid) * grid;

export const rectsIntersect = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
) =>
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y;

export const getCenter = (node: { x: number; y: number; width: number; height: number }) => ({
  x: node.x + node.width / 2,
  y: node.y + node.height / 2,
});
