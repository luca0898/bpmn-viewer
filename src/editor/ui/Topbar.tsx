import { useRef } from 'react';
import {
  ArrowLeftRight,
  Download,
  FileDown,
  FileUp,
  Grid3x3,
  Home,
  Redo2,
  Save,
  Undo2,
} from 'lucide-react';
import { useEditorStore } from '../state/editorStore';
import { createInitialDiagram } from '../model/initialDiagram';
import { exportDiagramJson } from '../io/jsonIO';
import { exportDiagramSvg } from '../io/exportSvg';

const computeDiagramBounds = (diagram: ReturnType<typeof useEditorStore.getState>['diagram']) => {
  const nodes = diagram.nodes.filter((node) => node.type !== 'lane');
  const bounds = nodes.reduce(
    (acc, node) => ({
      minX: Math.min(acc.minX, node.x),
      minY: Math.min(acc.minY, node.y),
      maxX: Math.max(acc.maxX, node.x + node.width),
      maxY: Math.max(acc.maxY, node.y + node.height),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity },
  );
  return bounds;
};

export function Topbar() {
  const diagram = useEditorStore((state) => state.diagram);
  const viewport = useEditorStore((state) => state.viewport);
  const setDiagram = useEditorStore((state) => state.setDiagram);
  const setViewport = useEditorStore((state) => state.setViewport);
  const undo = useEditorStore((state) => state.undo);
  const redo = useEditorStore((state) => state.redo);
  const toggleGrid = useEditorStore((state) => state.toggleGrid);
  const toggleSnap = useEditorStore((state) => state.toggleSnap);
  const gridEnabled = useEditorStore((state) => state.gridEnabled);
  const snapEnabled = useEditorStore((state) => state.snapEnabled);
  const addToast = useEditorStore((state) => state.addToast);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNew = () => {
    setDiagram(createInitialDiagram());
    addToast('Novo diagrama criado.', 'success');
  };

  const handleExportJson = () => {
    const data = exportDiagramJson(diagram);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.bpmn.json';
    link.click();
    URL.revokeObjectURL(url);
    addToast('JSON exportado.', 'success');
  };

  const handleExportSvg = () => {
    const data = exportDiagramSvg(diagram);
    const blob = new Blob([data], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'diagram.svg';
    link.click();
    URL.revokeObjectURL(url);
    addToast('SVG exportado.', 'success');
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    file
      .text()
      .then((text) => {
        setDiagram(JSON.parse(text));
        addToast('JSON importado.', 'success');
      })
      .catch(() => addToast('Falha ao importar JSON.', 'error'));
  };

  const handleFit = () => {
    const bounds = computeDiagramBounds(diagram);
    const container = document.getElementById('canvas-container');
    if (!container) {
      return;
    }
    const margin = 120;
    const width = bounds.maxX - bounds.minX + margin * 2;
    const height = bounds.maxY - bounds.minY + margin * 2;
    const scale = Math.max(0.2, Math.min(2.5, Math.min(container.clientWidth / width, container.clientHeight / height)));
    const centerX = bounds.minX + (bounds.maxX - bounds.minX) / 2;
    const centerY = bounds.minY + (bounds.maxY - bounds.minY) / 2;
    setViewport({
      scale,
      x: container.clientWidth / 2 - centerX * scale,
      y: container.clientHeight / 2 - centerY * scale,
    });
  };

  const handleCenter = () => {
    const bounds = computeDiagramBounds(diagram);
    const container = document.getElementById('canvas-container');
    if (!container) {
      return;
    }
    const centerX = bounds.minX + (bounds.maxX - bounds.minX) / 2;
    const centerY = bounds.minY + (bounds.maxY - bounds.minY) / 2;
    setViewport({
      ...viewport,
      x: container.clientWidth / 2 - centerX * viewport.scale,
      y: container.clientHeight / 2 - centerY * viewport.scale,
    });
  };

  return (
    <header className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
      <h1 className="text-lg font-semibold text-slate-900">BPMN V1 Editor</h1>
      <div className="ml-6 flex flex-1 items-center gap-2">
        <button className="editor-btn" onClick={handleNew} aria-label="Novo diagrama">
          <Save size={16} />
          Novo
        </button>
        <button className="editor-btn" onClick={() => fileInputRef.current?.click()} aria-label="Importar JSON">
          <FileUp size={16} />
          Importar
        </button>
        <button className="editor-btn" onClick={handleExportJson} aria-label="Exportar JSON">
          <FileDown size={16} />
          JSON
        </button>
        <button className="editor-btn" onClick={handleExportSvg} aria-label="Exportar SVG">
          <Download size={16} />
          SVG
        </button>
        <span className="mx-2 h-6 w-px bg-slate-200" />
        <button className="editor-btn" onClick={undo} aria-label="Desfazer">
          <Undo2 size={16} />
          Undo
        </button>
        <button className="editor-btn" onClick={redo} aria-label="Refazer">
          <Redo2 size={16} />
          Redo
        </button>
        <span className="mx-2 h-6 w-px bg-slate-200" />
        <button className="editor-btn" onClick={toggleGrid} aria-label="Alternar grid">
          <Grid3x3 size={16} className={gridEnabled ? 'text-emerald-600' : ''} />
          Grid
        </button>
        <button className="editor-btn" onClick={toggleSnap} aria-label="Alternar snap">
          <ArrowLeftRight size={16} className={snapEnabled ? 'text-emerald-600' : ''} />
          Snap
        </button>
        <span className="mx-2 h-6 w-px bg-slate-200" />
        <button className="editor-btn" onClick={handleFit} aria-label="Ajustar à tela">
          <Home size={16} />
          Fit
        </button>
        <button className="editor-btn" onClick={handleCenter} aria-label="Centralizar">
          <Home size={16} />
          Center
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImport} />
    </header>
  );
}
