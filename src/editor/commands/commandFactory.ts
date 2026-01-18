import { nanoid } from 'nanoid';
import type { Command } from './commandTypes';
import type { Diagram, EdgeBase, NodeBase } from '../model/types';
import { updateEdgesForNodes } from '../model/modelUtils';

export const addNodeCommand = (node: NodeBase): Command => ({
  id: nanoid(),
  label: `Add ${node.type}`,
  execute: (diagram) => ({
    ...diagram,
    nodes: [...diagram.nodes, node],
  }),
  undo: (diagram) => ({
    ...diagram,
    nodes: diagram.nodes.filter((item) => item.id !== node.id),
    edges: diagram.edges.filter(
      (edge) => edge.sourceId !== node.id && edge.targetId !== node.id,
    ),
  }),
});

export const updateNodeCommand = (nodeId: string, updates: Partial<NodeBase>): Command => {
  let before: NodeBase | undefined;
  return {
    id: nanoid(),
    label: 'Update node',
    execute: (diagram) => {
      const current = diagram.nodes.find((node) => node.id === nodeId);
      before = current ? structuredClone(current) : undefined;
      return {
        ...diagram,
        nodes: diagram.nodes.map((node) =>
          node.id === nodeId ? { ...node, ...updates } : node,
        ),
      };
    },
    undo: (diagram) => {
      if (!before) {
        return diagram;
      }
      return {
        ...diagram,
        nodes: diagram.nodes.map((node) => (node.id === nodeId ? before! : node)),
      };
    },
  };
};

export const moveNodesCommand = (moves: Array<{ id: string; x: number; y: number }>): Command => {
  let before: NodeBase[] = [];
  return {
    id: nanoid(),
    label: moves.length > 1 ? 'Move nodes' : 'Move node',
    execute: (diagram) => {
      before = structuredClone(
        diagram.nodes.filter((node) => moves.some((move) => move.id === node.id)),
      );
      const updatedNodes = diagram.nodes.map((node) => {
        const move = moves.find((entry) => entry.id === node.id);
        if (!move) {
          return node;
        }
        return { ...node, x: move.x, y: move.y };
      });
      return {
        ...diagram,
        nodes: updatedNodes,
        edges: updateEdgesForNodes({ ...diagram, nodes: updatedNodes }, moves.map((m) => m.id)),
      };
    },
    undo: (diagram) => {
      const updatedNodes = diagram.nodes.map((node) => {
        const previous = before.find((item) => item.id === node.id);
        return previous ?? node;
      });
      return {
        ...diagram,
        nodes: updatedNodes,
        edges: updateEdgesForNodes({ ...diagram, nodes: updatedNodes }, before.map((n) => n.id)),
      };
    },
  };
};

export const resizeNodeCommand = (nodeId: string, width: number, height: number): Command => {
  let before: NodeBase | undefined;
  return {
    id: nanoid(),
    label: 'Resize node',
    execute: (diagram) => {
      const current = diagram.nodes.find((node) => node.id === nodeId);
      before = current ? structuredClone(current) : undefined;
      const updatedNodes = diagram.nodes.map((node) =>
        node.id === nodeId ? { ...node, width, height } : node,
      );
      return {
        ...diagram,
        nodes: updatedNodes,
        edges: updateEdgesForNodes({ ...diagram, nodes: updatedNodes }, [nodeId]),
      };
    },
    undo: (diagram) => {
      if (!before) {
        return diagram;
      }
      const updatedNodes = diagram.nodes.map((node) =>
        node.id === nodeId ? before! : node,
      );
      return {
        ...diagram,
        nodes: updatedNodes,
        edges: updateEdgesForNodes({ ...diagram, nodes: updatedNodes }, [nodeId]),
      };
    },
  };
};

export const deleteNodesCommand = (nodeIds: string[]): Command => {
  let beforeNodes: NodeBase[] = [];
  let beforeEdges: EdgeBase[] = [];
  return {
    id: nanoid(),
    label: 'Delete selection',
    execute: (diagram) => {
      beforeNodes = structuredClone(diagram.nodes.filter((node) => nodeIds.includes(node.id)));
      beforeEdges = structuredClone(
        diagram.edges.filter(
          (edge) => nodeIds.includes(edge.sourceId) || nodeIds.includes(edge.targetId),
        ),
      );
      return {
        ...diagram,
        nodes: diagram.nodes.filter((node) => !nodeIds.includes(node.id)),
        edges: diagram.edges.filter(
          (edge) => !nodeIds.includes(edge.sourceId) && !nodeIds.includes(edge.targetId),
        ),
      };
    },
    undo: (diagram) => ({
      ...diagram,
      nodes: [...diagram.nodes, ...beforeNodes],
      edges: [...diagram.edges, ...beforeEdges],
    }),
  };
};

export const addEdgeCommand = (edge: EdgeBase): Command => ({
  id: nanoid(),
  label: 'Add connection',
  execute: (diagram) => ({
    ...diagram,
    edges: [...diagram.edges, edge],
  }),
  undo: (diagram) => ({
    ...diagram,
    edges: diagram.edges.filter((item) => item.id !== edge.id),
  }),
});

export const deleteEdgesCommand = (edgeIds: string[]): Command => {
  let before: EdgeBase[] = [];
  return {
    id: nanoid(),
    label: 'Delete edges',
    execute: (diagram) => {
      before = structuredClone(diagram.edges.filter((edge) => edgeIds.includes(edge.id)));
      return {
        ...diagram,
        edges: diagram.edges.filter((edge) => !edgeIds.includes(edge.id)),
      };
    },
    undo: (diagram) => ({
      ...diagram,
      edges: [...diagram.edges, ...before],
    }),
  };
};

export const updateEdgeCommand = (edgeId: string, updates: Partial<EdgeBase>): Command => {
  let before: EdgeBase | undefined;
  return {
    id: nanoid(),
    label: 'Update edge',
    execute: (diagram) => {
      const current = diagram.edges.find((edge) => edge.id === edgeId);
      before = current ? structuredClone(current) : undefined;
      return {
        ...diagram,
        edges: diagram.edges.map((edge) =>
          edge.id === edgeId ? { ...edge, ...updates } : edge,
        ),
      };
    },
    undo: (diagram) => {
      if (!before) {
        return diagram;
      }
      return {
        ...diagram,
        edges: diagram.edges.map((edge) => (edge.id === edgeId ? before! : edge)),
      };
    },
  };
};
