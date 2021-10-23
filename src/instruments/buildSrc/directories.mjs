import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

// eslint-disable-next-line no-underscore-dangle
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const Directories = {
    temp: path.join(os.tmpdir(), 'instruments-build'),
    instruments: path.join(__dirname, '/..'),
    instrumentsAceOutput: path.join(__dirname, '/../aceBundles'),
    src: path.join(__dirname, '../..'),
    root: path.join(__dirname, '../../..'),
};
