/**
 * A heap which allocates instances of a resource.
 */
export class ResourceHeap<T> {
  private readonly cache: T[] = [];
  private numAllocated = 0;

  /**
   * Constructor.
   * @param factory A function which creates new instances of this heap's resource.
   * @param destructor A function which destroys instances of this heap's resource.
   * @param onAllocated A function which is called when an instance of this heap's resource is allocated.
   * @param onFreed A function which is called when an instance of this heap's resource is freed.
   * @param initialSize The initial size of this heap. Defaults to `0`.
   * @param maxSize The maximum size of this heap. Defaults to `Number.MAX_SAFE_INTEGER`. This heap cannot allocate
   * more resources than its maximum size.
   * @param autoShrinkThreshold The size above which this heap will attempt to automatically reduce its size when
   * resources are freed. The heap will never reduce its size below this threshold. Defaults to
   * `Number.MAX_SAFE_INTEGER`.
   */
  constructor(
    private readonly factory: () => T,
    private readonly destructor: (resource: T) => void,
    private readonly onAllocated?: (resource: T) => void,
    private readonly onFreed?: (resource: T) => void,
    initialSize = 0,
    public readonly maxSize = Number.MAX_SAFE_INTEGER,
    private readonly autoShrinkThreshold = Number.MAX_SAFE_INTEGER
  ) {
    for (let i = 0; i < Math.min(initialSize, maxSize); i++) {
      this.cache.push(factory());
    }
  }

  /**
   * Allocates a resource instance from this heap. If this heap has an existing free resource available, one will be
   * returned. Otherwise, a new resource instance will be created, added to the heap, and returned.
   * @returns A resource.
   * @throws Error if this heap has reached its allocation limit.
   */
  public allocate(): T {
    if (this.numAllocated >= this.maxSize) {
      throw new Error(`ResourceHeap: maximum number of allocations (${this.maxSize}) reached`);
    }

    let resource: T;

    if (this.numAllocated < this.cache.length) {
      resource = this.cache[this.numAllocated];
    } else {
      this.cache.push(resource = this.factory());
    }

    this.numAllocated++;

    if (this.onAllocated !== undefined) {
      this.onAllocated(resource);
    }

    return resource;
  }

  /**
   * Frees a resource instance allocated from this heap, allowing it to be re-used.
   * @param resource The resource to free.
   */
  public free(resource: T): void {
    const index = this.cache.indexOf(resource);

    if (index < 0 || index >= this.numAllocated) {
      return;
    }

    const freed = this.cache[index];

    this.numAllocated--;

    this.cache[index] = this.cache[this.numAllocated];
    this.cache[this.numAllocated] = freed;

    // If the heap size is over the auto-shrink threshold and the number of allocated instances drops to less than or
    // equal to half of the heap size, then reduce the size of the heap to the threshold, or 125% of the number of
    // allocated instances, whichever is greater.
    if (this.cache.length > this.autoShrinkThreshold && this.numAllocated <= this.cache.length / 2) {
      const newLength = Math.max(this.autoShrinkThreshold, this.numAllocated * 1.25);

      for (let i = newLength; i < this.cache.length; i++) {
        this.destructor(this.cache[i]);
      }

      this.cache.length = newLength;
    }

    if (this.onFreed !== undefined) {
      this.onFreed(resource);
    }
  }
}