export enum TaskCategory {
    EfisVectors,
}

export interface Task {
    category: TaskCategory,
    tag: string,
    executor: () => Generator,
}

export class TaskQueue {
    private taskQueue: Task[] = [];

    private currentTask: Task | null = null;

    private currentTaskExecutor: Generator | null = null;

    update(_deltaTime: number): void {
        if (!this.currentTask && this.taskQueue.length > 0) {
            const nextTask = this.taskQueue.shift();

            if (nextTask) {
                this.currentTask = nextTask;
                this.currentTaskExecutor = nextTask.executor();
            }
        }

        if (this.currentTask) {
            const done = this.currentTaskExecutor.next().done;

            if (done) {
                this.currentTask = null;
                this.currentTaskExecutor = null;
            }
        }
    }

    runStepTask(executor: Task) {
        this.taskQueue.push(executor);
    }

    cancelAllInCategory(category: TaskCategory) {
        if (this.currentTask?.category === category) {
            this.currentTask = null;
            this.currentTaskExecutor = null;
        }

        for (const queuedTask of this.taskQueue) {
            if (queuedTask.category === category) {
                this.taskQueue = this.taskQueue.filter((task) => task === queuedTask);
            }
        }
    }
}
