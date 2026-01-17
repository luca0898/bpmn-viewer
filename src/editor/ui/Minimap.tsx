import { useMemo } from 'react';
import { useEditorStore } from '../state/editorStore';

export function Minimap() {
  const diagram = useEditorStore((state) => state.diagram);
  const viewport = useEditorStore((state) => state.viewport);

  const bounds = useMemo(() => {
    return diagram.nodes.reduce(
      (acc, node) => ({
        minX: Math.min(acc.minX, node.x),
        minY: Math.min(acc.minY, node.y),
        maxX: Math.max(acc.maxX, node.x + node.width),
        maxY: Math.max(acc.maxY, node.y + node.height),
      }),
      { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
    );
  }, [diagram.nodes]);

  const width = bounds.maxX - bounds.minX + 200;
  const height = bounds.maxY - bounds.minY + 200;

  return (
    <div className="absolute bottom-4 left-4 rounded border border-slate-200 bg-white p-2 shadow">
      <svg width={160} height={100} viewBox={`${bounds.minX - 100} ${bounds.minY - 100} ${width} ${height}`}>
        {diagram.nodes.map((node) => (
          <rect key={node.id} x={node.x} y={node.y} width={node.width} height={node.height} fill="#e2e8f0" stroke="#94a3b8" strokeWidth={1} />
        ))}
        <rect
          x={-viewport.x / viewport.scale}
          y={-viewport.y / viewport.scale}
          width={160 / viewport.scale}
          height={100 / viewport.scale}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}
