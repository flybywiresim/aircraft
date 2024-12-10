/**
 * Hax to determine if we're running under MSFS2024.
 */
export function isMsfs2024(): boolean {
  return window.InputBar.MENU_BUTTON_A === 'KEY_MENU_SR_VALID';
}
