import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { useEditorStore } from '../state/editorStore';
import type { EdgeBase, NodeBase, NodeType } from '../model/types';
import { clamp, GRID_SIZE, rectsIntersect, screenToWorld, worldToScreen } from '../model/geometry';
import {
  addEdgeCommand,
  addNodeCommand,
  deleteEdgesCommand,
  deleteNodesCommand,
  moveNodesCommand,
  resizeNodeCommand,
  updateEdgeCommand,
  updateNodeCommand,
} from '../commands/commandFactory';
import { buildEdge, getNodeById } from '../model/modelUtils';
import { createNode } from '../model/nodeFactory';

const NODE_ORDER: NodeType[] = [
  'pool',
  'lane',
  'subprocess',
  'task',
  'userTask',
  'serviceTask',
  'exclusiveGateway',
  'parallelGateway',
  'startEvent',
  'endEvent',
  'textAnnotation',
  'dataObject',
];

const NODE_LABEL_THRESHOLD = 0.45;

export function Canvas() {
  const diagram = useEditorStore((state) => state.diagram);
  const selection = useEditorStore((state) => state.selection);
  const viewport = useEditorStore((state) => state.viewport);
  const setSelection = useEditorStore((state) => state.setSelection);
  const setViewport = useEditorStore((state) => state.setViewport);
  const gridEnabled = useEditorStore((state) => state.gridEnabled);
  const snapEnabled = useEditorStore((state) => state.snapEnabled);
  const runCommand = useEditorStore((state) => state.runCommand);
  const addToast = useEditorStore((state) => state.addToast);

  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [dragState, setDragState] = useState<{
    ids: string[];
    origin: { x: number; y: number };
    nodePositions: Record<string, { x: number; y: number }>;
    currentPositions: Record<string, { x: number; y: number }>;
  } | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<{
    sourceId: string;
    start: { x: number; y: number };
    current: { x: number; y: number };
  } | null>(null);
  const [editing, setEditing] = useState<{
    id: string;
    value: string;
    kind: 'node' | 'edge';
  } | null>(null);
  const [resizing, setResizing] = useState<{
    id: string;
    origin: { x: number; y: number };
    size: { width: number; height: number };
    current: { width: number; height: number };
  } | null>(null);

  const orderedNodes = useMemo(
    () =>
      [...diagram.nodes].sort(
        (a, b) => NODE_ORDER.indexOf(a.type) - NODE_ORDER.indexOf(b.type),
      ),
    [diagram.nodes],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(true);
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selection.type === 'node') {
          runCommand(deleteNodesCommand(selection.ids), { ids: [], type: 'none' });
        }
        if (selection.type === 'edge') {
          runCommand(deleteEdgesCommand(selection.ids), { ids: [], type: 'none' });
        }
      }
      if (event.key === 'z' && (event.ctrlKey || event.metaKey)) {
        event.shiftKey ? useEditorStore.getState().redo() : useEditorStore.getState().undo();
      }
      if (event.key === 'y' && (event.ctrlKey || event.metaKey)) {
        useEditorStore.getState().redo();
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        setSpacePressed(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selection, runCommand]);

  const handleWheel = (event: React.WheelEvent) => {
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();
    const delta = -event.deltaY * 0.001;
    const nextScale = clamp(viewport.scale + delta, 0.2, 2.5);
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const rect = container.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const world = screenToWorld(point, viewport);
    const nextViewport = {
      scale: nextScale,
      x: point.x - world.x * nextScale,
      y: point.y - world.y * nextScale,
    };
    setViewport(nextViewport);
  };

  const startDrag = (event: React.PointerEvent, node: NodeBase) => {
    if (event.button !== 0) {
      return;
    }
    event.stopPropagation();
    const selectedIds = selection.type === 'node' && selection.ids.includes(node.id)
      ? selection.ids
      : [node.id];
    setSelection({ ids: selectedIds, type: 'node' });
    const world = screenToWorld({ x: event.clientX, y: event.clientY }, viewport);
    const positions: Record<string, { x: number; y: number }> = {};
    selectedIds.forEach((id) => {
      const item = diagram.nodes.find((n) => n.id === id);
      if (item) {
        positions[id] = { x: item.x, y: item.y };
      }
    });
    setDragState({ ids: selectedIds, origin: world, nodePositions: positions, currentPositions: positions });
  };

  const startResize = (event: React.PointerEvent, node: NodeBase) => {
    event.stopPropagation();
    const world = screenToWorld({ x: event.clientX, y: event.clientY }, viewport);
    setResizing({
      id: node.id,
      origin: world,
      size: { width: node.width, height: node.height },
      current: { width: node.width, height: node.height },
    });
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.button === 1 || spacePressed) {
      setIsPanning(true);
      return;
    }
    setSelection({ ids: [], type: 'none' });
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    if (isPanning) {
      setViewport({
        ...viewport,
        x: viewport.x + event.movementX,
        y: viewport.y + event.movementY,
      });
      return;
    }
    if (dragState) {
      const world = screenToWorld({ x: event.clientX, y: event.clientY }, viewport);
      const dx = world.x - dragState.origin.x;
      const dy = world.y - dragState.origin.y;
      const currentPositions = dragState.ids.reduce<Record<string, { x: number; y: number }>>(
        (acc, id) => {
        const original = dragState.nodePositions[id];
        if (!original) {
          return acc;
        }
        let nextX = original.x + dx;
        let nextY = original.y + dy;
        if (snapEnabled) {
          nextX = Math.round(nextX / GRID_SIZE) * GRID_SIZE;
          nextY = Math.round(nextY / GRID_SIZE) * GRID_SIZE;
        }
        const node = diagram.nodes.find((item) => item.id === id);
        if (node?.laneId) {
          const lane = diagram.nodes.find((item) => item.id === node.laneId);
          if (lane) {
            nextX = clamp(nextX, lane.x + 10, lane.x + lane.width - node.width - 10);
            nextY = clamp(nextY, lane.y + 10, lane.y + lane.height - node.height - 10);
          }
        }
        acc[id] = { x: nextX, y: nextY };
        return acc;
      }, {});
      setDragState({ ...dragState, currentPositions });
      return;
    }
    if (resizing) {
      const world = screenToWorld({ x: event.clientX, y: event.clientY }, viewport);
      const width = Math.max(120, resizing.size.width + (world.x - resizing.origin.x));
      const height = Math.max(80, resizing.size.height + (world.y - resizing.origin.y));
      setResizing({ ...resizing, current: { width, height } });
      return;
    }
    if (connecting) {
      const world = screenToWorld({ x: event.clientX, y: event.clientY }, viewport);
      setConnecting({ ...connecting, current: world });
    }
  };

  const finishInteraction = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
    if (dragState) {
      const moves = dragState.ids.map((id) => ({
        id,
        x: dragState.currentPositions[id]?.x ?? dragState.nodePositions[id]?.x ?? 0,
        y: dragState.currentPositions[id]?.y ?? dragState.nodePositions[id]?.y ?? 0,
      }));
      runCommand(moveNodesCommand(moves));
      dragState.ids.forEach((id) => {
        const node = diagram.nodes.find((item) => item.id === id);
        if (!node) {
          return;
        }
        const lanes = diagram.nodes.filter((item) => item.type === 'lane');
        const nextLane = lanes.find((lane) =>
          rectsIntersect({ x: node.x, y: node.y, width: node.width, height: node.height }, lane),
        );
        if (nextLane && node.laneId !== nextLane.id) {
          runCommand(
            updateNodeCommand(node.id, { laneId: nextLane.id, poolId: nextLane.poolId }),
          );
        }
      });
      setDragState(null);
    }
    if (resizing) {
      runCommand(resizeNodeCommand(resizing.id, resizing.current.width, resizing.current.height));
      setResizing(null);
    }
    if (connecting) {
      if (hoverNodeId && hoverNodeId !== connecting.sourceId) {
        const source = getNodeById(diagram, connecting.sourceId);
        const target = getNodeById(diagram, hoverNodeId);
        if (source && target) {
          const edgeType = source.poolId && target.poolId && source.poolId !== target.poolId
            ? 'message'
            : 'sequence';
          if (edgeType === 'sequence' && source.poolId && target.poolId && source.poolId !== target.poolId) {
            addToast('Sequence flow entre pools diferentes não é permitido.', 'error');
          } else if (edgeType === 'message' && source.poolId === target.poolId) {
            addToast('Message flow deve conectar pools diferentes.', 'error');
          } else {
            runCommand(addEdgeCommand(buildEdge(source, target, edgeType)));
          }
        }
      }
      setConnecting(null);
    }
  }, [
    addToast,
    connecting,
    diagram,
    dragState,
    hoverNodeId,
    isPanning,
    resizing,
    runCommand,
  ]);

  const handlePointerUp = () => {
    finishInteraction();
  };

  useEffect(() => {
    const handler = () => finishInteraction();
    window.addEventListener('pointerup', handler);
    window.addEventListener('pointercancel', handler);
    return () => {
      window.removeEventListener('pointerup', handler);
      window.removeEventListener('pointercancel', handler);
    };
  }, [finishInteraction]);

  const handleEdgeClick = (edge: EdgeBase) => {
    setSelection({ ids: [edge.id], type: 'edge' });
  };

  const handleNodeDoubleClick = (node: NodeBase) => {
    setEditing({ id: node.id, value: node.name, kind: 'node' });
  };

  const commitEditing = () => {
    if (editing) {
      if (editing.kind === 'node') {
        runCommand(updateNodeCommand(editing.id, { name: editing.value }));
      } else {
        runCommand(updateEdgeCommand(editing.id, { label: editing.value }));
      }
      setEditing(null);
    }
  };

  const handleQuickAdd = (node: NodeBase, type: NodeType) => {
    const offset = 200;
    const newNode = createNode(type, { x: node.x + offset, y: node.y });
    newNode.poolId = node.poolId;
    newNode.laneId = node.laneId;
    runCommand(addNodeCommand(newNode), { ids: [newNode.id], type: 'node' });
    runCommand(addEdgeCommand(buildEdge(node, newNode, 'sequence')));
  };

  const selectedNode = selection.type === 'node' && selection.ids.length === 1
    ? diagram.nodes.find((node) => node.id === selection.ids[0])
    : null;

  const selectedEdge = selection.type === 'edge' && selection.ids.length === 1
    ? diagram.edges.find((edge) => edge.id === selection.ids[0])
    : null;

  const overlayPosition = selectedNode
    ? worldToScreen({ x: selectedNode.x + selectedNode.width / 2, y: selectedNode.y + selectedNode.height / 2 }, viewport)
    : null;

  const edgeEditPosition = (() => {
    if (!editing || editing.kind !== 'edge') {
      return null;
    }
    const edge = diagram.edges.find((item) => item.id === editing.id);
    if (!edge || edge.waypoints.length === 0) {
      return null;
    }
    const mid = edge.waypoints[Math.floor(edge.waypoints.length / 2)];
    return worldToScreen({ x: mid.x, y: mid.y }, viewport);
  })();

  return (
    <div
      ref={containerRef}
      id="canvas-container"
      className="relative h-full w-full bg-canvas"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg className="h-full w-full" role="presentation">
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="10"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L9,3 z" fill="#1f2937" />
          </marker>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="1" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={gridEnabled ? 'url(#grid)' : 'transparent'}
        />
        <g transform={`translate(${viewport.x} ${viewport.y}) scale(${viewport.scale})`}>
          {diagram.edges.map((edge) => {
            const path = edge.waypoints
              .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
              .join(' ');
            const dash = edge.type === 'message' ? '6 4' : edge.type === 'association' ? '3 3' : undefined;
            return (
              <g key={edge.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={selectedEdge?.id === edge.id ? '#2563eb' : '#1f2937'}
                  strokeWidth={2}
                  markerEnd={edge.type === 'sequence' ? 'url(#arrow)' : undefined}
                  strokeDasharray={dash}
                  onClick={() => handleEdgeClick(edge)}
                  onDoubleClick={() => setEditing({ id: edge.id, value: edge.label ?? '', kind: 'edge' })}
                />
                {edge.label && (
                  <text x={edge.waypoints[1]?.x ?? 0} y={edge.waypoints[1]?.y ?? 0} className="fill-slate-600 text-xs">
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}
          {connecting && (
            <path
              d={`M ${connecting.start.x} ${connecting.start.y} L ${connecting.current.x} ${connecting.current.y}`}
              stroke="#2563eb"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
          )}
          {orderedNodes.map((node) => {
            const isSelected = selection.type === 'node' && selection.ids.includes(node.id);
            const showLabel = viewport.scale > NODE_LABEL_THRESHOLD;
            const preview = dragState?.currentPositions[node.id];
            const sizePreview = resizing?.id === node.id ? resizing.current : null;
            const renderNode = preview ? { ...node, ...preview } : node;
            const renderWidth = sizePreview?.width ?? renderNode.width;
            const renderHeight = sizePreview?.height ?? renderNode.height;
            const commonProps = {
              onPointerDown: (event: React.PointerEvent) => startDrag(event, renderNode),
              onDoubleClick: () => handleNodeDoubleClick(renderNode),
              onPointerEnter: () => setHoverNodeId(node.id),
              onPointerLeave: () => setHoverNodeId(null),
            };

            return (
              <g key={node.id} {...commonProps} className="cursor-pointer">
                {node.type === 'startEvent' || node.type === 'endEvent' ? (
                  <circle
                    cx={renderNode.x + renderWidth / 2}
                    cy={renderNode.y + renderHeight / 2}
                    r={renderWidth / 2}
                    fill="white"
                    stroke={isSelected ? '#2563eb' : '#1f2937'}
                    strokeWidth={node.type === 'endEvent' ? 3 : 2}
                  />
                ) : node.type === 'exclusiveGateway' || node.type === 'parallelGateway' ? (
                  <polygon
                    points={`
                      ${renderNode.x + renderWidth / 2},${renderNode.y}
                      ${renderNode.x + renderWidth},${renderNode.y + renderHeight / 2}
                      ${renderNode.x + renderWidth / 2},${renderNode.y + renderHeight}
                      ${renderNode.x},${renderNode.y + renderHeight / 2}
                    `}
                    fill="white"
                    stroke={isSelected ? '#2563eb' : '#1f2937'}
                    strokeWidth={2}
                  />
                ) : (
                  <rect
                    x={renderNode.x}
                    y={renderNode.y}
                    width={renderWidth}
                    height={renderHeight}
                    rx={node.type === 'pool' || node.type === 'lane' ? 0 : 12}
                    fill="white"
                    stroke={isSelected ? '#2563eb' : node.type === 'pool' ? '#64748b' : '#1f2937'}
                    strokeWidth={node.type === 'pool' || node.type === 'lane' ? 2 : 2}
                  />
                )}
                {showLabel && (
                  <text
                    x={renderNode.x + renderWidth / 2}
                    y={renderNode.y + renderHeight / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-700 text-xs"
                  >
                    {node.name}
                  </text>
                )}
                {isSelected && node.type !== 'pool' && node.type !== 'lane' && (
                  <g>
                    {['top', 'right', 'bottom', 'left'].map((position) => {
                      const handleSize = 6;
                      const positions = {
                        top: { x: renderNode.x + renderWidth / 2, y: renderNode.y - 10 },
                        right: { x: renderNode.x + renderWidth + 10, y: renderNode.y + renderHeight / 2 },
                        bottom: { x: renderNode.x + renderWidth / 2, y: renderNode.y + renderHeight + 10 },
                        left: { x: renderNode.x - 10, y: renderNode.y + renderHeight / 2 },
                      } as const;
                      const pos = positions[position as keyof typeof positions];
                      return (
                        <circle
                          key={position}
                          cx={pos.x}
                          cy={pos.y}
                          r={handleSize}
                          fill="#2563eb"
                          onPointerDown={(event) => {
                            event.stopPropagation();
                            const start = { x: pos.x, y: pos.y };
                            setConnecting({ sourceId: node.id, start, current: start });
                          }}
                        />
                      );
                    })}
                  </g>
                )}
                {isSelected && (node.type === 'pool' || node.type === 'lane') && (
                  <rect
                    x={renderNode.x + renderWidth - 10}
                    y={renderNode.y + renderHeight - 10}
                    width={12}
                    height={12}
                    fill="#2563eb"
                    onPointerDown={(event) => startResize(event, node)}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {selectedNode && overlayPosition && (
        <div
          className="pointer-events-none absolute left-0 top-0"
          style={{ transform: `translate(${overlayPosition.x}px, ${overlayPosition.y}px)` }}
        >
          <div className="-translate-x-1/2 -translate-y-1/2">
            <div className="flex gap-2">
              {['task', 'exclusiveGateway', 'endEvent'].map((type) => (
                <button
                  key={type}
                  className="pointer-events-auto rounded-full border border-emerald-200 bg-white px-2 py-1 text-xs text-emerald-700 shadow"
                  onClick={() => handleQuickAdd(selectedNode, type as NodeType)}
                >
                  + {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {editing && editing.kind === 'node' && selectedNode && (
        <input
          className="absolute rounded border border-slate-300 bg-white px-2 py-1 text-xs"
          style={{
            left: worldToScreen({ x: selectedNode.x, y: selectedNode.y }, viewport).x,
            top: worldToScreen({ x: selectedNode.x, y: selectedNode.y }, viewport).y - 30,
          }}
          value={editing.value}
          onChange={(event) => setEditing({ ...editing, value: event.target.value })}
          onBlur={commitEditing}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitEditing();
            }
            if (event.key === 'Escape') {
              setEditing(null);
            }
          }}
          autoFocus
        />
      )}
      {editing && editing.kind === 'edge' && edgeEditPosition && (
        <input
          className="absolute rounded border border-slate-300 bg-white px-2 py-1 text-xs"
          style={{
            left: edgeEditPosition.x,
            top: edgeEditPosition.y - 24,
          }}
          value={editing.value}
          onChange={(event) => setEditing({ ...editing, value: event.target.value })}
          onBlur={commitEditing}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              commitEditing();
            }
            if (event.key === 'Escape') {
              setEditing(null);
            }
          }}
          autoFocus
        />
      )}
    </div>
  );
}
