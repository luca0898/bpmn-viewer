import type { Diagram } from '../model/types';

export const exportBpmnXml = (diagram: Diagram) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- TODO: Implement BPMN 2.0 XML export. Diagram name: ${diagram.metadata.name} -->`;
};

export const importBpmnXml = (raw: string) => {
  void raw;
  throw new Error('Import BPMN XML: TODO');
};
