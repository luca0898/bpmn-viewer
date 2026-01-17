import { describe, expect, it } from 'vitest';
import { routeEdge } from './edgeRouting';

const node = (x: number, y: number) => ({
  id: `${x}-${y}`,
  type: 'task' as const,
  name: 'Task',
  x,
  y,
  width: 100,
  height: 80,
  documentation: '',
  properties: {},
});

describe('routeEdge', () => {
  it('creates an orthogonal route with 4 waypoints', () => {
    const waypoints = routeEdge(node(0, 0), node(300, 200));
    expect(waypoints).toHaveLength(4);
    expect(waypoints[0]).toEqual({ x: 50, y: 40 });
    expect(waypoints[3]).toEqual({ x: 350, y: 240 });
  });
});
