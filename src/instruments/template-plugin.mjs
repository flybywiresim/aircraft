'use strict';

import fs from 'fs';
import path from 'path';

const OUTPUT_DIR_ROOT = path.normalize('/Pages/VCockpit/Instruments');

const trim = (text) => `${text.trimStart().trimEnd()}\n`;

const htmlTemplate = (name, imports, finalOutputDir) => `
<script type="text/html" id="${name}_TEMPLATE">
    <div id="MSFS_REACT_MOUNT">
        <h1>If you're seeing this, React didn't load.</h1>
    </div>
</script>

<link rel="stylesheet" href="${finalOutputDir}/bundle.css" />

<script type="text/html" import-script="${finalOutputDir}/template.js" import-async="false"></script>
${imports.map((path) => `<script type="text/html" import-script="${path}" import-async="false"></script>`).join('\n')}
`;

const jsTemplate = (name, isInteractive, finalOutputDir) => `
'use strict';

class ${name}_Logic extends BaseInstrument {
    constructor() {
        super();
        let lastTime = this._lastTime;
        this.getDeltaTime = () => {
            const nowTime = Date.now();
            const deltaTime = nowTime - lastTime;
            lastTime = nowTime;

            return deltaTime;
        };
    }

    get templateID() {
        return '${name}_TEMPLATE';
    }

    get isInteractive() {
        return ${isInteractive};
    }

    get IsGlassCockpit() {
        return true;
    }

    connectedCallback() {
        super.connectedCallback();
        
        Include.addScript('${finalOutputDir}/bundle.js');
    }

    Update() {
        super.Update();
        this.dispatchEvent(new CustomEvent('update', { detail: this.getDeltaTime() }));
    }

    onInteractionEvent(event) {
        const eventName = String(event);
        this.dispatchEvent(new CustomEvent(eventName));
        this.dispatchEvent(new CustomEvent('*', { detail: eventName }));
    }
}

registerInstrument('a32nx-${name.toLowerCase()}', ${name}_Logic);
`

export default ({ name, isInteractive, outputDir, instrumentDir, imports }) => ({
    name: 'msfs',
    writeBundle() {
        const relativeOutputDirStart = outputDir.indexOf(OUTPUT_DIR_ROOT);

        if (relativeOutputDirStart === -1) {
            this.error({ message: `outputDir must contain '${OUTPUT_DIR_ROOT}', was: ${outputDir}` });
        }

        const relativeOutputDir = outputDir.substring(relativeOutputDirStart);
        const finalOutputDir = path.join(relativeOutputDir, instrumentDir);

        const sanitizedFinalOutputDir = finalOutputDir.replace(/\\/g, '/');

        const html = htmlTemplate(name, imports, sanitizedFinalOutputDir);
        const js = jsTemplate(name, isInteractive, sanitizedFinalOutputDir);

        // Write output
        fs.mkdirSync(path.join(outputDir, instrumentDir), { recursive: true });
        fs.writeFileSync(path.join(outputDir, instrumentDir, 'template.html'), trim(html));
        fs.writeFileSync(path.join(outputDir, instrumentDir, 'template.js'), trim(js));
    },
});
