import { rollup } from 'rollup';

const ensureArray = (obj) => (Array.isArray(obj) ? obj : [obj]);

async function runWorker(targetToBuild) {
    const { default: rollupConfigModule } = await import(('../simulatorBuild.mjs'));

    const configs = {};
    for (const config of ensureArray(rollupConfigModule)) {
        configs[config.name] = config;
    }

    const config = configs[targetToBuild];
    delete config.name;

    const bundle = await rollup(config);
    bundle.write(config.output);
}

const targetToBuild = process.argv[2];

runWorker(targetToBuild);
