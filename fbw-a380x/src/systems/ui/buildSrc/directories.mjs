import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const directoryName = path.dirname(fileURLToPath(import.meta.url));

export const Directories = {
    temp: path.join(os.tmpdir(), 'ui-build'),
    ui: path.join(directoryName, '/..'),
    src: path.join(directoryName, '../..'),
    root: path.join(directoryName, '../../../../..'),
};
