import type { Diagram } from '../model/types';

export const exportDiagramJson = (diagram: Diagram) =>
  JSON.stringify(diagram, null, 2);

export const importDiagramJson = (raw: string): Diagram => JSON.parse(raw) as Diagram;
