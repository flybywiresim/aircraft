/**
 * A binary min-heap. Each element added to the heap is ordered according to the value of an assigned key relative
 * to the keys of the other elements in the heap. The relative values of element keys are defined by a supplied
 * comparator function. Retrieval of the element with the smallest key (minimum element) is performed in constant time.
 * Removal of the minimum element and insertions are performed in logarithmic time. Additionally, this type of heap
 * supports combined insertion and removal operations (in either order) which are slightly more efficient than chaining
 * the two operations separately.
 */
export class BinaryHeap<T> {
  private readonly tree: T[] = [];

  // eslint-disable-next-line jsdoc/require-returns
  /** The number of elements contained in this heap. */
  public get size(): number {
    return this.tree.length;
  }

  /**
   * Constructor.
   * @param comparator The function that this heap uses to compare the keys of its elements. The function returns 0 if
   * `a` and `b` share the same key, a negative number if `a` has a lower key than `b`, and a positive number if `a`
   * has a greater key than `b`.
   */
  constructor(private readonly comparator: (a: T, b: T) => number) {
  }

  /**
   * Finds the element in this heap with the smallest key.
   * @returns The element in this heap with the smallest key, or undefined if this heap is empty.
   */
  public findMin(): T | undefined {
    return this.tree[0];
  }

  /**
   * Removes and returns the element in this heap with the smallest key.
   * @returns The removed element, or undefined if this heap is empty.
   */
  public removeMin(): T | undefined {
    if (this.tree.length === 0) {
      return undefined;
    }

    const min = this.tree[0];

    this.swap(0, this.tree.length - 1);
    this.tree.length--;
    this.heapifyDown(0);

    return min;
  }

  /**
   * Inserts an element into this heap.
   * @param element The element to insert.
   * @returns This heap, after the element has been inserted.
   */
  public insert(element: T): this {
    this.tree.push(element);
    this.heapifyUp(this.tree.length - 1);

    return this;
  }

  /**
   * Inserts an element into this heap, then removes the element with the smallest key.
   * @param element The element to insert.
   * @returns The removed element.
   */
  public insertAndRemoveMin(element: T): T {
    if (this.tree.length === 0 || this.comparator(element, this.tree[0]) <= 0) {
      return element;
    }

    return this.removeMinAndInsert(element) as T;
  }

  /**
   * Removes the element in this heap with the smallest key, then inserts a new element.
   * @param element The element to insert.
   * @returns The removed element, or undefined if this heap was empty before the new element was inserted.
   */
  public removeMinAndInsert(element: T): T | undefined {
    const min = this.tree[0];
    this.tree[0] = element;
    this.heapifyDown(0);

    return min;
  }

  /**
   * Removes all elements from this heap.
   * @returns This heap, after it has been cleared.
   */
  public clear(): this {
    this.tree.length = 0;

    return this;
  }

  /**
   * Restores the heap property for this heap upwards from a node which potentially violates the property.
   * @param index The index of the node at which to begin the operation.
   */
  private heapifyUp(index: number): void {
    let parent = BinaryHeap.parent(index);
    while (parent >= 0 && this.comparator(this.tree[index], this.tree[parent]) < 0) {
      this.swap(parent, index);
      index = parent;
      parent = BinaryHeap.parent(index);
    }
  }

  /**
   * Restores the heap property for this heap downwards from a node which potentially violates the property.
   * @param index The index of the node at which to begin the operation.
   */
  private heapifyDown(index: number): void {
    const len = this.tree.length;

    while (index < len) {
      const left = BinaryHeap.left(index);
      const right = BinaryHeap.right(index);

      let needSwapFlags = 0;
      if (left < len && this.comparator(this.tree[index], this.tree[left]) > 0) {
        needSwapFlags |= 1;
      }
      if (right < len && this.comparator(this.tree[index], this.tree[right]) > 0) {
        needSwapFlags |= 2;
      }
      if (needSwapFlags === 3) {
        needSwapFlags = this.comparator(this.tree[left], this.tree[right]) <= 0 ? 1 : 2;
      }

      if (needSwapFlags === 0) {
        break;
      }

      const swapChild = needSwapFlags === 1 ? left : right;

      this.swap(index, swapChild);
      index = swapChild;
    }
  }

  /**
   * Swaps two nodes in this heap.
   * @param index1 The index of the first node.
   * @param index2 The index of the second node.
   */
  private swap(index1: number, index2: number): void {
    const old1 = this.tree[index1];
    this.tree[index1] = this.tree[index2];
    this.tree[index2] = old1;
  }

  /**
   * Finds the index of a node's parent.
   * @param index the index of the node for which to find the parent.
   * @returns The index of the query node's parent.
   */
  private static parent(index: number): number {
    return (index - 1) >> 1;
  }

  /**
   * Finds the index of a node's left child.
   * @param index The index of the node for which to find the child.
   * @returns The index of the query node's left child.
   */
  private static left(index: number): number {
    return index * 2 + 1;
  }

  /**
   * Finds the index of a node's right child.
   * @param index The index of the node for which to find the child.
   * @returns The idnex of the query node's right child.
   */
  private static right(index: number): number {
    return index * 2 + 2;
  }
}