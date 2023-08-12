const dotenv = require('dotenv');
const path = require("path");

function defineEnvVars() {
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
 */
function esbuildModuleBuild(projectRoot, globalName, entryPoint, outFile) {
    const isProductionBuild = process.env.A32NX_PRODUCTION_BUILD === '1';

    process.chdir(projectRoot);

    return {
        absWorkingDir: __dirname,

        define: { DEBUG: 'false', ...defineEnvVars() },

        entryPoints: [entryPoint],
        bundle: true,
        treeShaking: false,
        minify: isProductionBuild,

        outfile: path.join(__dirname, outFile),

        format: 'iife',
        globalName,

        sourcemap: isProductionBuild ? 'linked' : undefined,

        // Target approximate CoherentGT WebKit version
        target: 'safari11',
    };
}

module.exports.esbuildModuleBuild = esbuildModuleBuild;
