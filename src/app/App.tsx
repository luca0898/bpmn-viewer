import { useEffect } from 'react';
import { Topbar } from '../editor/ui/Topbar';
import { Palette } from '../editor/ui/Palette';
import { Canvas } from '../editor/ui/Canvas';
import { PropertiesPanel } from '../editor/ui/PropertiesPanel';
import { IssuesPanel } from '../editor/ui/IssuesPanel';
import { Minimap } from '../editor/ui/Minimap';
import { useEditorStore } from '../editor/state/editorStore';
import { Toasts } from '../editor/ui/Toasts';
import { loadDiagramFromStorage, saveDiagramToStorage } from '../editor/io/storage';

export function App() {
  const diagram = useEditorStore((state) => state.diagram);
  const setDiagram = useEditorStore((state) => state.setDiagram);

  useEffect(() => {
    const stored = loadDiagramFromStorage();
    if (stored) {
      setDiagram(stored);
    }
  }, [setDiagram]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      saveDiagramToStorage(diagram);
    }, 350);
    return () => window.clearTimeout(handle);
  }, [diagram]);

  return (
    <div className="flex h-screen flex-col">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r border-slate-200 bg-white">
          <Palette />
        </aside>
        <main className="relative flex flex-1 flex-col bg-slate-50">
          <div className="flex-1 overflow-hidden">
            <Canvas />
          </div>
          <div className="border-t border-slate-200 bg-white">
            <IssuesPanel />
          </div>
        </main>
        <aside className="w-80 border-l border-slate-200 bg-white">
          <PropertiesPanel />
        </aside>
      </div>
      <Minimap />
      <Toasts />
    </div>
  );
}
