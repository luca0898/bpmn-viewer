import { describe, expect, it } from 'vitest';
import { addNodeCommand, moveNodesCommand } from './commandFactory';
import type { Diagram } from '../model/types';

const baseDiagram: Diagram = {
  nodes: [
    {
      id: 'task',
      type: 'task',
      name: 'Task',
      x: 100,
      y: 100,
      width: 160,
      height: 100,
      documentation: '',
      properties: { taskType: 'generic' },
    },
  ],
  edges: [],
  metadata: {
    name: 'Test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

describe('commandFactory', () => {
  it('adds and removes nodes via undo', () => {
    const node = {
      id: 'start',
      type: 'startEvent' as const,
      name: 'Start',
      x: 0,
      y: 0,
      width: 60,
      height: 60,
      documentation: '',
      properties: { eventType: 'start' as const },
    };
    const command = addNodeCommand(node);
    const next = command.execute(baseDiagram);
    expect(next.nodes).toHaveLength(2);
    const previous = command.undo(next);
    expect(previous.nodes).toHaveLength(1);
  });

  it('moves nodes and restores positions', () => {
    const command = moveNodesCommand([{ id: 'task', x: 200, y: 200 }]);
    const next = command.execute(baseDiagram);
    expect(next.nodes[0]?.x).toBe(200);
    const previous = command.undo(next);
    expect(previous.nodes[0]?.x).toBe(100);
  });
});
