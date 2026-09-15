export interface InputState {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export function createInputState(): InputState {
  return { left: false, right: false, jump: false };
}
