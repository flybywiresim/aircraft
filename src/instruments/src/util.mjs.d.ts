export const renderTarget = document.getElementById('A32NX_REACT_MOUNT');
export const customElement = renderTarget.parentElement;

export function useInteractionEvent(event, handler);
export function useUpdate(handler);
export function getSimVar(name, type?);
export function setSimVar(name, value, type = SIMVAR_TYPES[name]);