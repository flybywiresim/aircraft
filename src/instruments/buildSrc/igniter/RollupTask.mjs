import { GenericTask } from '@flybywiresim/igniter';
import { promisify } from 'util';
import { exec } from 'child_process';

export class RollupTask extends GenericTask {
    constructor(
        key,
        targetToBuild,
        hashFolders,
    ) {
        super(key, async () => {
            await promisify(exec)(`node src/instruments/buildSrc/igniter/RollupTaskWorker.mjs ${targetToBuild}`);
        }, hashFolders);
    }
}
