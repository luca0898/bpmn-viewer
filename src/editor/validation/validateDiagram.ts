import type { Diagram, EdgeBase, NodeBase } from '../model/types';
import { getPoolForNode } from '../model/modelUtils';
import type { EditorIssue } from '../state/editorStore';

const hasIncoming = (diagram: Diagram, nodeId: string, edgeType = 'sequence') =>
  diagram.edges.some((edge) => edge.targetId === nodeId && edge.type === edgeType);

const hasOutgoing = (diagram: Diagram, nodeId: string, edgeType = 'sequence') =>
  diagram.edges.some((edge) => edge.sourceId === nodeId && edge.type === edgeType);

const getOutgoing = (diagram: Diagram, nodeId: string) =>
  diagram.edges.filter((edge) => edge.sourceId === nodeId);

const isGateway = (node: NodeBase) =>
  node.type === 'exclusiveGateway' || node.type === 'parallelGateway';

export const validateDiagram = (diagram: Diagram): EditorIssue[] => {
  const issues: EditorIssue[] = [];
  diagram.nodes.forEach((node) => {
    if (node.type === 'startEvent' && hasIncoming(diagram, node.id)) {
      issues.push({
        id: `start-incoming-${node.id}`,
        severity: 'error',
        message: 'Start event não pode ter fluxo de entrada.',
        elementId: node.id,
      });
    }
    if (node.type === 'endEvent' && hasOutgoing(diagram, node.id)) {
      issues.push({
        id: `end-outgoing-${node.id}`,
        severity: 'error',
        message: 'End event não pode ter fluxo de saída.',
        elementId: node.id,
      });
    }
    if (node.type !== 'startEvent' && !isGateway(node) && !hasIncoming(diagram, node.id)) {
      issues.push({
        id: `dangling-in-${node.id}`,
        severity: 'error',
        message: 'Elemento sem fluxo de entrada.',
        elementId: node.id,
      });
    }
    if (node.type !== 'endEvent' && !isGateway(node) && !hasOutgoing(diagram, node.id)) {
      issues.push({
        id: `dangling-out-${node.id}`,
        severity: 'error',
        message: 'Elemento sem fluxo de saída.',
        elementId: node.id,
      });
    }
    if (node.type === 'exclusiveGateway') {
      const outgoing = getOutgoing(diagram, node.id).filter((edge) => edge.type === 'sequence');
      if (outgoing.length > 1) {
        const withCondition = outgoing.filter((edge) => edge.condition || edge.isDefault);
        if (withCondition.length !== outgoing.length) {
          issues.push({
            id: `gateway-condition-${node.id}`,
            severity: 'warning',
            message: 'Gateway XOR com saídas sem condição.',
            elementId: node.id,
          });
        }
      }
      if (outgoing.length > 5) {
        issues.push({
          id: `gateway-complex-${node.id}`,
          severity: 'warning',
          message: 'Gateway XOR com muitas saídas (complexidade alta).',
          elementId: node.id,
        });
      }
    }
    if (node.type === 'pool' && !node.properties.participantName) {
      issues.push({
        id: `pool-name-${node.id}`,
        severity: 'warning',
        message: 'Pool sem participante definido.',
        elementId: node.id,
      });
    }
  });

  diagram.edges.forEach((edge) => {
    const source = diagram.nodes.find((node) => node.id === edge.sourceId);
    const target = diagram.nodes.find((node) => node.id === edge.targetId);
    if (!source || !target) {
      return;
    }
    const sourcePool = getPoolForNode(diagram, source)?.id;
    const targetPool = getPoolForNode(diagram, target)?.id;
    if (edge.type === 'sequence' && sourcePool && targetPool && sourcePool !== targetPool) {
      issues.push({
        id: `sequence-cross-${edge.id}`,
        severity: 'error',
        message: 'Sequence flow entre pools diferentes não é permitido.',
        elementId: edge.id,
      });
    }
    if (edge.type === 'message' && sourcePool && targetPool && sourcePool === targetPool) {
      issues.push({
        id: `message-same-${edge.id}`,
        severity: 'warning',
        message: 'Message flow deve conectar pools diferentes.',
        elementId: edge.id,
      });
    }
  });

  return issues;
};

export const enforceGatewayDefaults = (edges: EdgeBase[], gatewayId: string, edgeId: string) =>
  edges.map((edge) => {
    if (edge.sourceId === gatewayId && edge.id !== edgeId) {
      return { ...edge, isDefault: false };
    }
    return edge;
  });
