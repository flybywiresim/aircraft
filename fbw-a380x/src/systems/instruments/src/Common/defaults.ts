// We currently assume that these two elements will be found.
// Might be worth implementing checking in the future.

let reactMount = document.getElementById('MSFS_REACT_MOUNT') as HTMLElement;

const getEcamPageRenderTarget = (pageName: string): HTMLElement =>
  document.getElementById(`A32NX_${pageName}_PAGE_REACT_MOUNT`) as HTMLElement;

/**
 * Configures the framework to render inside the ECAM. Temporary solution for moving individual SD pages to React.
 */
export const setIsEcamPage = (pageName: string) => {
  reactMount = getEcamPageRenderTarget(pageName);
};

/**
 * Returns the render target which React mounts onto
 */
export const getRenderTarget = () => reactMount;

/**
 * Returns the root element which receives `update` events
 */
export const getRootElement: () => HTMLElement = () => {
  if (reactMount?.parentElement) {
    return reactMount.parentElement;
  }
  throw new Error('Could not find rootElement');
};
