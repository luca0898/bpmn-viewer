import { useMemo } from 'react';
import { useEditorStore } from '../state/editorStore';
import { updateEdgeCommand, updateNodeCommand } from '../commands/commandFactory';
import { enforceGatewayDefaults } from '../validation/validateDiagram';

export function PropertiesPanel() {
  const diagram = useEditorStore((state) => state.diagram);
  const selection = useEditorStore((state) => state.selection);
  const runCommand = useEditorStore((state) => state.runCommand);

  const selectedNode = useMemo(() => {
    if (selection.type !== 'node' || selection.ids.length !== 1) {
      return null;
    }
    return diagram.nodes.find((node) => node.id === selection.ids[0]) ?? null;
  }, [diagram.nodes, selection]);

  const selectedEdge = useMemo(() => {
    if (selection.type !== 'edge' || selection.ids.length !== 1) {
      return null;
    }
    return diagram.edges.find((edge) => edge.id === selection.ids[0]) ?? null;
  }, [diagram.edges, selection]);

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Selecione um elemento para editar suas propriedades.
      </div>
    );
  }

  if (selectedEdge) {
    return (
      <div className="p-6 text-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Edge</h2>
        <label className="mb-3 block text-xs font-semibold text-slate-500">Tipo</label>
        <select
          className="mb-4 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          value={selectedEdge.type}
          onChange={(event) =>
            runCommand(updateEdgeCommand(selectedEdge.id, { type: event.target.value as 'sequence' | 'message' | 'association' }))
          }
        >
          <option value="sequence">Sequence</option>
          <option value="message">Message</option>
          <option value="association">Association</option>
        </select>
        <label className="mb-2 block text-xs font-semibold text-slate-500">Label</label>
        <input
          className="mb-4 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          value={selectedEdge.label ?? ''}
          onChange={(event) => runCommand(updateEdgeCommand(selectedEdge.id, { label: event.target.value }))}
        />
        <label className="mb-2 block text-xs font-semibold text-slate-500">Condition</label>
        <input
          className="mb-4 w-full rounded border border-slate-200 px-3 py-2 text-sm"
          value={selectedEdge.condition ?? ''}
          onChange={(event) => runCommand(updateEdgeCommand(selectedEdge.id, { condition: event.target.value }))}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selectedEdge.isDefault ?? false}
            onChange={(event) => {
              const beforeEdges = structuredClone(diagram.edges);
              const nextEdges = enforceGatewayDefaults(
                diagram.edges.map((edge) =>
                  edge.id === selectedEdge.id ? { ...edge, isDefault: event.target.checked } : edge,
                ),
                selectedEdge.sourceId,
                selectedEdge.id,
              );
              runCommand({
                id: crypto.randomUUID(),
                label: 'Toggle default flow',
                execute: (diagramState) => ({ ...diagramState, edges: nextEdges }),
                undo: (diagramState) => ({ ...diagramState, edges: beforeEdges }),
              });
            }}
          />
          Default flow
        </label>
      </div>
    );
  }

  if (!selectedNode) {
    return null;
  }

  return (
    <div className="flex h-full flex-col gap-4 p-6 text-sm">
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">ID</label>
        <input className="w-full rounded border border-slate-200 px-3 py-2 text-xs" value={selectedNode.id} readOnly />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Name</label>
        <input
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          value={selectedNode.name}
          onChange={(event) => runCommand(updateNodeCommand(selectedNode.id, { name: event.target.value }))}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-500">Documentation</label>
        <textarea
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
          rows={3}
          value={selectedNode.documentation ?? ''}
          onChange={(event) => runCommand(updateNodeCommand(selectedNode.id, { documentation: event.target.value }))}
        />
      </div>
      {selectedNode.type === 'task' || selectedNode.type === 'userTask' || selectedNode.type === 'serviceTask' ? (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Task Type</label>
          <select
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={selectedNode.properties.taskType ?? 'generic'}
            onChange={(event) =>
              runCommand(updateNodeCommand(selectedNode.id, { properties: { ...selectedNode.properties, taskType: event.target.value as 'generic' | 'user' | 'service' } }))
            }
          >
            <option value="generic">Generic</option>
            <option value="user">User</option>
            <option value="service">Service</option>
          </select>
          {selectedNode.type === 'userTask' && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-slate-500">Assignee</label>
              <input
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                value={selectedNode.properties.assignee ?? ''}
                onChange={(event) =>
                  runCommand(updateNodeCommand(selectedNode.id, { properties: { ...selectedNode.properties, assignee: event.target.value } }))
                }
              />
            </div>
          )}
          {selectedNode.type === 'serviceTask' && (
            <div className="mt-3">
              <label className="mb-1 block text-xs font-semibold text-slate-500">Implementation</label>
              <input
                className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
                value={selectedNode.properties.implementation ?? ''}
                onChange={(event) =>
                  runCommand(updateNodeCommand(selectedNode.id, { properties: { ...selectedNode.properties, implementation: event.target.value } }))
                }
              />
            </div>
          )}
        </div>
      ) : null}
      {selectedNode.type === 'startEvent' || selectedNode.type === 'endEvent' ? (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Event Type</label>
          <select
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={selectedNode.properties.eventType ?? (selectedNode.type === 'startEvent' ? 'start' : 'end')}
            onChange={(event) =>
              runCommand(updateNodeCommand(selectedNode.id, { properties: { ...selectedNode.properties, eventType: event.target.value as 'start' | 'end' } }))
            }
          >
            <option value="start">Start</option>
            <option value="end">End</option>
          </select>
        </div>
      ) : null}
      {selectedNode.type === 'exclusiveGateway' || selectedNode.type === 'parallelGateway' ? (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Gateway Type</label>
          <select
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={selectedNode.properties.gatewayType ?? (selectedNode.type === 'exclusiveGateway' ? 'xor' : 'and')}
            onChange={(event) =>
              runCommand(updateNodeCommand(selectedNode.id, { properties: { ...selectedNode.properties, gatewayType: event.target.value as 'xor' | 'and' } }))
            }
          >
            <option value="xor">XOR</option>
            <option value="and">AND</option>
          </select>
        </div>
      ) : null}
      {selectedNode.type === 'pool' && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Participant</label>
          <input
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={selectedNode.properties.participantName ?? ''}
            onChange={(event) =>
              runCommand(updateNodeCommand(selectedNode.id, { properties: { ...selectedNode.properties, participantName: event.target.value } }))
            }
          />
        </div>
      )}
      {selectedNode.type === 'lane' && (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-500">Lane name</label>
          <input
            className="w-full rounded border border-slate-200 px-3 py-2 text-sm"
            value={selectedNode.properties.laneName ?? ''}
            onChange={(event) =>
              runCommand(updateNodeCommand(selectedNode.id, { properties: { ...selectedNode.properties, laneName: event.target.value } }))
            }
          />
        </div>
      )}
    </div>
  );
}
