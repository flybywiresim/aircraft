/** Scroll utils */
export class ScrollUtils {
  /**
   * Scrolls the container to make sure an element is in view.
   * @param el The element to scroll into view in the container.
   * @param container The container to scroll.
   */
  public static ensureInView(el: HTMLElement, container: HTMLElement): void {
    const cHeight = container.offsetHeight;
    const eHeight = el.offsetHeight;
    if (eHeight > cHeight) {
      return;
    }

    const cTop = container.scrollTop;
    const cBottom = cTop + cHeight;

    try {
      const eTop = ScrollUtils.findOffsetTopRelativeToAncestor(el, container);
      const eBottom = eTop + eHeight;

      if (!this.isElementInViewport(cTop, cBottom, eTop, eBottom)) {
        if (eTop < cTop) {
          container.scrollTop -= (cTop - eTop);
        } else if (eBottom > cBottom) {
          container.scrollTop += (eBottom - cBottom);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }

  /**
   * Finds the offsetTop of an element relative to one of its ancestors.
   * @param element An element.
   * @param ancestor An ancestor of `element`.
   * @returns the offsetTop of the element relative to the ancestor.
   * @throws Error if the offsetTop could not be calculated.
   */
  private static findOffsetTopRelativeToAncestor(element: HTMLElement, ancestor: HTMLElement): number {
    const ancestorParent = ancestor.offsetParent;

    let top = element.offsetTop;
    while (element.offsetParent !== ancestorParent) {
      if (!(element.offsetParent instanceof HTMLElement)) {
        throw new Error('Element\'s offset ancestry does not directly lead to the specified ancestor');
      }
      element = element.offsetParent;
      top += element.offsetTop;
    }
    return top - ancestor.offsetTop;
  }

  /**
   * Checks if an element is visible.
   * @param cTop The top coordinate of the scroll container.
   * @param cBottom The bottom coordinate of the scroll container.
   * @param eTop The top coordinate of the element.
   * @param eBottom The bottom coordinate of the element.
   * @returns A boolean.
   */
  private static isElementInViewport(cTop: number, cBottom: number, eTop: number, eBottom: number): boolean {
    return eTop >= cTop && eBottom <= cBottom;
  }
}