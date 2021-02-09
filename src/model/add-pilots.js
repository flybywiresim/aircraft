'use strict';

const fs = require('fs');
const path = require('path');
const byteData = require('byte-data');

function combineGltf(pathA, pathB, outputPath) {
    const gltfA = JSON.parse(fs.readFileSync(pathA, 'utf8'));
    const gltfB = JSON.parse(fs.readFileSync(pathB, 'utf8'));

    const nodesCount = gltfA.nodes.length;
    const meshesCount = gltfA.meshes.length;

    // Add nodes
    for (const node of gltfB.nodes) {
        node.mesh += meshesCount;
        if (node.children) {
            const newChildren = [];
            for (const child of node.children) {
                newChildren.push(child + nodesCount);
            }
            node.children = newChildren;
        }
        gltfA.nodes.push(node);
    }

    // Add nodes to scene
    for (let i = 0; i < gltfB.nodes.length; i += 1) {
        gltfA.scenes[0].nodes.push(i + nodesCount);
    }

    // Write output file
    const data = JSON.stringify(gltfA);
    fs.writeFileSync(outputPath, data);
}


const models = JSON.parse(fs.readFileSync(path.join(__dirname, 'add-pilots.json'), 'utf8'));
const p = (n) => path.resolve(__dirname, n);
for (const model of models) {
    for (let i = 0; i < model.gltf.length; i += 1) {
        fs.copyFileSync(p(model.gltf[i]), p(model.output.gltf[i]));
        for (const addition of model.additions) {
            combineGltf(p(model.output.gltf[i]), p(addition.gltf), p(model.output.gltf[i]));
        }
    }
}
