import { useMemo } from 'react';
import { ArrowRightCircle, Diamond, GitFork, LayoutPanelTop, Square, User } from 'lucide-react';
import { useEditorStore } from '../state/editorStore';
import { createNode } from '../model/nodeFactory';
import { addNodeCommand } from '../commands/commandFactory';
import { getNodeById } from '../model/modelUtils';

const paletteItems = [
  { type: 'startEvent', label: 'Start Event', icon: ArrowRightCircle },
  { type: 'endEvent', label: 'End Event', icon: ArrowRightCircle },
  { type: 'task', label: 'Task', icon: Square },
  { type: 'userTask', label: 'User Task', icon: User },
  { type: 'serviceTask', label: 'Service Task', icon: GitFork },
  { type: 'exclusiveGateway', label: 'Gateway XOR', icon: Diamond },
  { type: 'parallelGateway', label: 'Gateway AND', icon: Diamond },
  { type: 'pool', label: 'Pool', icon: LayoutPanelTop },
  { type: 'lane', label: 'Lane', icon: LayoutPanelTop },
  { type: 'textAnnotation', label: 'Text Annotation', icon: Square },
  { type: 'dataObject', label: 'Data Object', icon: Square },
] as const;

export function Palette() {
  const runCommand = useEditorStore((state) => state.runCommand);
  const selection = useEditorStore((state) => state.selection);
  const diagram = useEditorStore((state) => state.diagram);

  const suggestions = useMemo(() => {
    if (selection.type !== 'node' || selection.ids.length !== 1) {
      return [];
    }
    const node = getNodeById(diagram, selection.ids[0]);
    if (!node) {
      return [];
    }
    if (node.type === 'startEvent') {
      return ['task'] as const;
    }
    if (node.type === 'exclusiveGateway' || node.type === 'parallelGateway') {
      return ['task'] as const;
    }
    if (node.type === 'task' || node.type === 'userTask' || node.type === 'serviceTask') {
      return ['task', 'exclusiveGateway', 'endEvent'] as const;
    }
    return [];
  }, [diagram, selection]);

  const handleAdd = (type: (typeof paletteItems)[number]['type']) => {
    if (type === 'pool') {
      const pool = createNode('pool', { x: 160, y: 160 }, { properties: { participantName: 'Novo participante' } });
      const lane = createNode('lane', { x: pool.x + 40, y: pool.y + 40 }, {
        width: pool.width - 60,
        height: pool.height - 60,
        poolId: pool.id,
        properties: { laneName: 'Nova lane' },
      });
      runCommand(addNodeCommand(pool));
      runCommand(addNodeCommand(lane), { ids: [lane.id], type: 'node' });
      return;
    }
    if (type === 'lane') {
      const pool = diagram.nodes.find((node) => node.type === 'pool');
      if (!pool) {
        return;
      }
      const laneCount = diagram.nodes.filter((node) => node.type === 'lane' && node.poolId === pool.id).length;
      const laneHeight = Math.max(120, (pool.height - 60) / (laneCount + 1));
      const lane = createNode('lane', { x: pool.x + 40, y: pool.y + 40 + laneCount * laneHeight }, {
        width: pool.width - 60,
        height: laneHeight - 10,
        poolId: pool.id,
        properties: { laneName: `Lane ${laneCount + 1}` },
      });
      runCommand(addNodeCommand(lane), { ids: [lane.id], type: 'node' });
      return;
    }
    const node = createNode(type, { x: 220, y: 220 });
    runCommand(addNodeCommand(node), { ids: [node.id], type: 'node' });
  };

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div>
        <h2 className="text-xs font-semibold uppercase text-slate-500">Palette</h2>
        <div className="mt-3 grid gap-2">
          {paletteItems.map((item) => (
            <button
              key={item.type}
              className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-300"
              onClick={() => handleAdd(item.type)}
            >
              <item.icon size={16} className="text-slate-600" />
              {item.label}
            </button>
          ))}
        </div>
      </div>
      {suggestions.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase text-slate-500">Sugestões</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map((type) => (
              <button
                key={type}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
                onClick={() => handleAdd(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
