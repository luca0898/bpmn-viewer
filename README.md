# BPMN V1 Editor (React + TypeScript + Tailwind)

Editor BPMN V1 “fora da curva”, process-aware, com engine próprio (modelo, render, validação e comandos), pronto para rodar localmente.

## Como rodar

```bash
npm install
npm run dev
```

## Scripts úteis

- `npm run dev` — ambiente local com Vite.
- `npm run build` — build de produção.
- `npm run preview` — preview do build.
- `npm run lint` — lint do projeto.
- `npm run format` — checagem de formatação (Prettier).
- `npm run test` — testes (Vitest).

## Atalhos principais

- **Pan**: segure `Space` + arraste (ou botão do meio do mouse).
- **Zoom**: `Ctrl + scroll` (com zoom para o cursor).
- **Undo/Redo**: `Ctrl + Z`, `Ctrl + Shift + Z` ou `Ctrl + Y`.
- **Delete**: `Delete` ou `Backspace` para remover seleção.
- **Edição inline**: duplo clique no nome de um nó ou no label da edge.

## Funcionalidades V1

- Canvas infinito com pan/zoom, grid e snap-to-grid.
- Paleta de elementos BPMN (eventos, tasks, gateways, pools/lanes).
- Editor process-aware com **undo/redo por comandos**.
- Quick-add contextual (atalhos ao redor do nó selecionado).
- Properties panel contextual para nós e edges.
- Validação em tempo real + Issues panel com navegação.
- Persistência automática em **LocalStorage**.
- Import/export de **JSON**.
- Export de **SVG**.
- Minimap simples.

## Limitações / TODO

- Import/export BPMN XML (estrutura pronta para extensão).
- Roteamento de edges mais sofisticado e ajuste manual de waypoints.
- Guides de alinhamento e resize avançado.
- Otimizações de render para diagramas muito grandes.

## Estrutura do projeto

```
/src
  /app            # Shell de layout
  /editor
    /model        # Tipos, helpers e AST
    /commands     # Command pattern + undo/redo
    /render       # Render e roteamento de edges
    /state        # Zustand store
    /validation   # Regras de validação
    /io           # Import/export + persistência
    /ui           # Componentes de UI
```

## Notas técnicas

- Renderização via SVG (nós, edges, labels, handles).
- Coordenadas em world-space com helpers `worldToScreen` e `screenToWorld`.
- Edges com roteamento ortogonal simples (manhattan-ish).
