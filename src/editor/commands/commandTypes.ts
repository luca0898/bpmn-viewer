import type { Diagram } from '../model/types';

export type Command = {
  id: string;
  label: string;
  execute: (diagram: Diagram) => Diagram;
  undo: (diagram: Diagram) => Diagram;
};

export type CommandHistory = {
  past: Command[];
  future: Command[];
};
