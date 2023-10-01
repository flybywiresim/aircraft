const dotenv = require('dotenv');
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
    const isProductionBuild = process.env.A32NX_PRODUCTION_BUILD === '1';

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
            if (!(process.env.FBW_TYPECHECK === '1' || process.env.FBW_TYPECHECK?.toLowerCase() === 'true')) {
                return;
            }

            const { entryPoints } = build.initialOptions;
            const entryPointDir = path.dirname(entryPoints[0]);

            const tsConfigInEntryPointDir = fs.existsSync(path.join(entryPointDir, 'tsconfig.json'));

            let tsConfigPath;
            if (tsConfigInEntryPointDir) {
                tsConfigPath = entryPointDir;
            } else if (build.initialOptions.tsconfig !== undefined) {
                tsConfigPath = path.dirname(build.initialOptions.tsconfig);
            }

            if (tsConfigPath === undefined) {
                throw new Error(`Cannot run typechecking: no tsconfig.json file found in '${entryPointDir}' and tsconfig path not specified`);
            }

            try {
                childProcess.execSync('npx tsc --noEmit -p .', { cwd: tsConfigPath, stdio: 'inherit' });
            } catch (e) {
                throw new Error('Errors during type checking');
            }
        }
    }
}

module.exports.typecheckingPlugin = typecheckingPlugin;
