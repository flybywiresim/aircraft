const dotenv = require("dotenv");
const path = require("path");
const childProcess = require("child_process");
const fs = require("fs");

function defineEnvVars() {
    dotenv.config({ path: '.env.local' });
    dotenv.config();

    const defines = {};

    for (const envVar of Object.keys(process.env)) {
        const value = process.env[envVar].trim();

        let replacement;
        if (value.trim() === 'true' || value.trim() === 'false') {
            replacement = value;
        } else if (!Number.isNaN(parseFloat(value))) {
            replacement = parseFloat(value).toString();
        } else {
            replacement = `"${value}"`;
        }

        defines[`process.env.${envVar}`] = replacement;
    }

    return defines;
}

module.exports.defineEnvVars = defineEnvVars;

/**
 * @param projectRoot {string} the project root folder, as a path relative to the root of the repository
 * @param globalName {string|undefined} the name of the global to define in the output IIFE
 * @param entryPoint {string} the entrypoint path, as an absolute path
 * @param outFile {string} the output file path, as a path relative to the root of the repository
 * @param tsConfigDir {string?} the directory containing the tsconfig.json file to use, optionally
 *
 * @returns {import('esbuild').BuildOptions}
 */
function esbuildModuleBuild(projectRoot, globalName, entryPoint, outFile, tsConfigDir) {
    const isProductionBuild = process.env.FBW_PRODUCTION_BUILD === '1';

    process.chdir(projectRoot);

    return {
        absWorkingDir: __dirname,

        define: { DEBUG: 'false', ...defineEnvVars() },

        plugins: [
            typecheckingPlugin(),
        ],

        tsconfig: tsConfigDir !== undefined ? path.join(tsConfigDir, 'tsconfig.json') : undefined,

        entryPoints: [entryPoint],
        bundle: true,
        treeShaking: false,
        minify: isProductionBuild,

        outfile: path.join(__dirname, outFile),

        format: 'iife',
        globalName,

        sourcemap: isProductionBuild ? undefined : 'linked',

        // Target approximate CoherentGT WebKit version
        target: 'safari11',
    };
}

module.exports.createModuleBuild = esbuildModuleBuild;

/**
 * Returns an esbuild plugin which runs `tsc` typechecking
 *
 * @returns {import('esbuild').Plugin}
 */
function typecheckingPlugin() {
    return {
        name: 'typecheck',
        /**
         * @param build {import('esbuild').PluginBuild}
         */
        setup(build) {
            build.onStart(() => {
                if (!(process.env.FBW_TYPECHECK === '1' || process.env.FBW_TYPECHECK?.toLowerCase() === 'true')) {
                    return;
                }

                const { entryPoints } = build.initialOptions;
                const entryPointDir = path.dirname(entryPoints[0]);

                const tsConfigInEntryPointDir = fs.existsSync(path.join(entryPointDir, 'tsconfig.json'));

                let tsConfigDir;
                if (tsConfigInEntryPointDir) {
                    tsConfigDir = entryPointDir;
                } else if (build.initialOptions.tsconfig !== undefined) {
                    tsConfigDir = path.dirname(build.initialOptions.tsconfig);
                }

                if (tsConfigDir === undefined) {
                    throw new Error(`Cannot run typechecking: no tsconfig.json file found in '${entryPointDir}' and tsconfig path not specified`);
                }

                /**
                 * @type {import('esbuild').PartialMessage[]}
                 */
                const errors = []

                try {
                    childProcess.execSync('npx tsc --noEmit -p .', { cwd: tsConfigDir });
                } catch (e) {
                    if (!('stdout' in e) || !e.stdout) {
                        throw e;
                    }

                    const tscErrors = e.stdout.toString().split('\n').filter((err) => err.trim() !== '');

                    errors.push(...tscErrors.map((err) => {
                        const match = /(.+)\((\d+),(\d+)\):\s+(.+)/.exec(err.trim());

                        if (match) {
                            const [, file, line, column, text] = match;

                            const filePath = path.resolve(tsConfigDir, file);
                            const lineText = fs.readFileSync(filePath).toString().split('\n')[line - 1];

                            return { text, location: { file, line: parseInt(line), column: parseInt(column) - 1, lineText } }
                        } else {
                            return { text: err };
                        }
                    }));
                }

                return { errors };
            })
        }
    }
}

module.exports.typecheckingPlugin = typecheckingPlugin;
