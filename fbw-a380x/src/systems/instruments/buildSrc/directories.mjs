import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const directoryName = path.dirname(fileURLToPath(import.meta.url));

export const Directories = {
    temp: path.join(os.tmpdir(), 'instruments-build'),
    instruments: path.join(directoryName, '..'),
    instrumentsAceOutput: path.join(directoryName, '..', 'aceBundles'),
    src: path.join(directoryName, '..', '..'),
    root: path.join(directoryName, '..', '..', '..', '..', '..'),
};
