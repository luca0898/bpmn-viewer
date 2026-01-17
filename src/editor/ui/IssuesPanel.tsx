import { useState } from 'react';
import { useEditorStore } from '../state/editorStore';
import { worldToScreen } from '../model/geometry';

export function IssuesPanel() {
  const issues = useEditorStore((state) => state.issues);
  const diagram = useEditorStore((state) => state.diagram);
  const setSelection = useEditorStore((state) => state.setSelection);
  const setViewport = useEditorStore((state) => state.setViewport);
  const viewport = useEditorStore((state) => state.viewport);
  const [tab, setTab] = useState<'issues' | 'outline'>('issues');

  const handleFocus = (elementId?: string) => {
    if (!elementId) {
      return;
    }
    const node = diagram.nodes.find((item) => item.id === elementId);
    if (node) {
      setSelection({ ids: [node.id], type: 'node' });
      const container = document.getElementById('canvas-container');
      if (!container) {
        return;
      }
      const center = worldToScreen(
        { x: node.x + node.width / 2, y: node.y + node.height / 2 },
        viewport,
      );
      setViewport({
        ...viewport,
        x: viewport.x + container.clientWidth / 2 - center.x,
        y: viewport.y + container.clientHeight / 2 - center.y,
      });
      return;
    }
    const edge = diagram.edges.find((item) => item.id === elementId);
    if (edge) {
      setSelection({ ids: [edge.id], type: 'edge' });
    }
  };

  return (
    <div className="h-48">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-2">
        <button
          className={`text-xs font-semibold ${tab === 'issues' ? 'text-slate-900' : 'text-slate-400'}`}
          onClick={() => setTab('issues')}
        >
          Issues ({issues.length})
        </button>
        <button
          className={`text-xs font-semibold ${tab === 'outline' ? 'text-slate-900' : 'text-slate-400'}`}
          onClick={() => setTab('outline')}
        >
          Outline
        </button>
      </div>
      {tab === 'issues' ? (
        <div className="max-h-40 overflow-auto px-4 py-2 text-xs">
          {issues.length === 0 ? (
            <div className="text-slate-400">Sem issues.</div>
          ) : (
            issues.map((issue) => (
              <button
                key={issue.id}
                className="mb-2 flex w-full items-start gap-2 rounded border border-slate-100 bg-white px-2 py-1 text-left hover:border-slate-200"
                onClick={() => handleFocus(issue.elementId)}
              >
                <span
                  className={`mt-0.5 h-2 w-2 rounded-full ${
                    issue.severity === 'error' ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                />
                <span className="text-slate-600">{issue.message}</span>
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="max-h-40 overflow-auto px-4 py-2 text-xs">
          {diagram.nodes.map((node) => (
            <button
              key={node.id}
              className="mb-2 flex w-full items-center justify-between rounded border border-slate-100 bg-white px-2 py-1 text-left hover:border-slate-200"
              onClick={() => handleFocus(node.id)}
            >
              <span>{node.name || node.type}</span>
              <span className="text-slate-400">{node.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
