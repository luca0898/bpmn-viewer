import type { Diagram } from '../model/types';

const STORAGE_KEY = 'bpmn-v1-diagram';

export const saveDiagramToStorage = (diagram: Diagram) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(diagram));
};

export const loadDiagramFromStorage = (): Diagram | null => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as Diagram;
  } catch {
    return null;
  }
};
