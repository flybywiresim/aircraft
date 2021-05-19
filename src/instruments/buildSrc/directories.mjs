import os from 'os';

const __dirname = new URL('.', import.meta.url).pathname;

export const Directories = {
    temp: `${os.tmpdir()}/instruments-build`,
    instruments: `${__dirname}..`,
    src: `${__dirname}../..`,
    root: `${__dirname}../../..`,
}