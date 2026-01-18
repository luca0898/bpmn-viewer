import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Diagram, Selection, Viewport } from '../model/types';
import { createInitialDiagram } from '../model/initialDiagram';
import type { Command, CommandHistory } from '../commands/commandTypes';
import { validateDiagram } from '../validation/validateDiagram';

export type EditorIssue = {
  id: string;
  severity: 'error' | 'warning';
  message: string;
  elementId?: string;
};

export type EditorToast = {
  id: string;
  message: string;
  tone: 'success' | 'error' | 'info';
};

export type EditorState = {
  diagram: Diagram;
  selection: Selection;
  viewport: Viewport;
  gridEnabled: boolean;
  snapEnabled: boolean;
  issues: EditorIssue[];
  history: CommandHistory;
  toasts: EditorToast[];
  setDiagram: (diagram: Diagram) => void;
  setSelection: (selection: Selection) => void;
  runCommand: (command: Command, selection?: Selection) => void;
  undo: () => void;
  redo: () => void;
  setViewport: (viewport: Viewport) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  addToast: (message: string, tone?: EditorToast['tone']) => void;
  removeToast: (id: string) => void;
};

const initialDiagram = createInitialDiagram();

export const useEditorStore = create<EditorState>()(
  immer((set) => ({
    diagram: initialDiagram,
    selection: { ids: [], type: 'none' },
    viewport: { x: 0, y: 0, scale: 1 },
    gridEnabled: true,
    snapEnabled: true,
    issues: validateDiagram(initialDiagram),
    history: { past: [], future: [] },
    toasts: [],
    setDiagram: (diagram) =>
      set((state) => {
        state.diagram = diagram;
        state.issues = validateDiagram(diagram);
      }),
    setSelection: (selection) =>
      set((state) => {
        state.selection = selection;
      }),
    runCommand: (command, selection) =>
      set((state) => {
        state.diagram = command.execute(state.diagram);
        state.issues = validateDiagram(state.diagram);
        state.history.past.push(command);
        state.history.future = [];
        if (selection) {
          state.selection = selection;
        }
      }),
    undo: () =>
      set((state) => {
        const command = state.history.past.pop();
        if (!command) {
          return;
        }
        state.diagram = command.undo(state.diagram);
        state.issues = validateDiagram(state.diagram);
        state.history.future.push(command);
      }),
    redo: () =>
      set((state) => {
        const command = state.history.future.pop();
        if (!command) {
          return;
        }
        state.diagram = command.execute(state.diagram);
        state.issues = validateDiagram(state.diagram);
        state.history.past.push(command);
      }),
    setViewport: (viewport) =>
      set((state) => {
        state.viewport = viewport;
      }),
    toggleGrid: () =>
      set((state) => {
        state.gridEnabled = !state.gridEnabled;
      }),
    toggleSnap: () =>
      set((state) => {
        state.snapEnabled = !state.snapEnabled;
      }),
    addToast: (message, tone = 'info') =>
      set((state) => {
        const id = crypto.randomUUID();
        state.toasts.push({ id, message, tone });
      }),
    removeToast: (id) =>
      set((state) => {
        state.toasts = state.toasts.filter((toast) => toast.id !== id);
      }),
  })),
);
