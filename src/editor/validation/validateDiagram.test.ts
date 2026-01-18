import { describe, expect, it } from 'vitest';
import { validateDiagram } from './validateDiagram';
import type { Diagram } from '../model/types';

const baseDiagram: Diagram = {
  nodes: [
    {
      id: 'start',
      type: 'startEvent',
      name: 'Start',
      x: 0,
      y: 0,
      width: 60,
      height: 60,
      properties: { eventType: 'start' },
    },
    {
      id: 'task',
      type: 'task',
      name: 'Task',
      x: 200,
      y: 0,
      width: 140,
      height: 80,
      properties: { taskType: 'generic' },
    },
    {
      id: 'end',
      type: 'endEvent',
      name: 'End',
      x: 400,
      y: 0,
      width: 60,
      height: 60,
      properties: { eventType: 'end' },
    },
  ],
  edges: [
    {
      id: 'edge-1',
      type: 'sequence',
      sourceId: 'start',
      targetId: 'task',
      waypoints: [
        { x: 0, y: 0 },
        { x: 200, y: 0 },
      ],
    },
    {
      id: 'edge-2',
      type: 'sequence',
      sourceId: 'task',
      targetId: 'end',
      waypoints: [
        { x: 200, y: 0 },
        { x: 400, y: 0 },
      ],
    },
  ],
  metadata: {
    name: 'Test',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

describe('validateDiagram', () => {
  it('flags start event with incoming flow', () => {
    const diagram: Diagram = {
      ...baseDiagram,
      edges: [
        ...baseDiagram.edges,
        {
          id: 'edge-3',
          type: 'sequence',
          sourceId: 'task',
          targetId: 'start',
          waypoints: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
          ],
        },
      ],
    };
    const issues = validateDiagram(diagram);
    expect(issues.some((issue) => issue.message.includes('Start event'))).toBe(true);
  });

  it('warns about gateway conditions', () => {
    const diagram: Diagram = {
      ...baseDiagram,
      nodes: [
        ...baseDiagram.nodes,
        {
          id: 'gateway',
          type: 'exclusiveGateway',
          name: 'XOR',
          x: 100,
          y: 200,
          width: 80,
          height: 80,
          properties: { gatewayType: 'xor' },
        },
      ],
      edges: [
        ...baseDiagram.edges,
        {
          id: 'edge-4',
          type: 'sequence',
          sourceId: 'gateway',
          targetId: 'task',
          waypoints: [
            { x: 0, y: 0 },
            { x: 200, y: 0 },
          ],
        },
        {
          id: 'edge-5',
          type: 'sequence',
          sourceId: 'gateway',
          targetId: 'end',
          waypoints: [
            { x: 0, y: 0 },
            { x: 400, y: 0 },
          ],
        },
      ],
    };
    const issues = validateDiagram(diagram);
    expect(issues.some((issue) => issue.message.includes('Gateway XOR'))).toBe(true);
  });

  it('flags start event with multiple outgoing flows', () => {
    const diagram: Diagram = {
      ...baseDiagram,
      edges: [
        ...baseDiagram.edges,
        {
          id: 'edge-3',
          type: 'sequence',
          sourceId: 'start',
          targetId: 'end',
          waypoints: [
            { x: 0, y: 0 },
            { x: 400, y: 0 },
          ],
        },
      ],
    };
    const issues = validateDiagram(diagram);
    expect(issues.some((issue) => issue.message.includes('uma saída'))).toBe(true);
  });
});
