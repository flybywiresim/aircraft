'use strict';

const fs = require('fs');
const path = require('path');

function combineGltf(pathA, pathB, outputPath) {
    const gltfA = JSON.parse(fs.readFileSync(pathA, 'utf8'));
    const gltfB = JSON.parse(fs.readFileSync(pathB, 'utf8'));

    const accessorsCount = gltfA.accessors.length;
    const bufferViewsCount = gltfA.bufferViews.length;
    const materialsCount = gltfA.materials.length;
    const meshesCount = gltfA.meshes.length;
    const nodesCount = gltfA.nodes.length;
    const imagesCount = gltfA.images.length;
    const texturesCount = gltfA.textures.length;

    const bufferSize = gltfA.buffers[0].byteLength;

    // Add bufferViews
    for (const bufferView of gltfB.bufferViews) {
        if (Number.isFinite(bufferView.byteOffset)) {
            bufferView.byteOffset += bufferSize;
        } else {
            bufferView.byteOffset = bufferSize;
        }
        gltfA.bufferViews.push(bufferView);
    }

    // Add accessors
    for (const accessor of gltfB.accessors) {
        accessor.bufferView += bufferViewsCount;
        gltfA.accessors.push(accessor);
    }

    // Add textures & images
    if (gltfB.textures) {
        for (const texture of gltfB.textures) {
            if (texture.source) {
                texture.source += imagesCount;
            }
            if (texture.extensions && texture.extensions.MSFT_texture_dds) {
                texture.extensions.MSFT_texture_dds.source += imagesCount;
            }
            gltfA.textures.push(texture);
        }
        for (const image of gltfB.images) {
            gltfA.images.push(image);
        }
    }

    // Add materials
    if (gltfB.materials) {
        for (const material of gltfB.materials) {
            Object.keys(material)
                .forEach((matProperty) => {
                    const mat = material[matProperty];
                    if (Number.isFinite(mat.index)) {
                        mat.index += texturesCount;
                    }
                    if (mat.baseColorTexture) {
                        mat.baseColorTexture.index += texturesCount;
                    }
                    if (mat.metallicRoughnessTexture) {
                        mat.metallicRoughnessTexture.index += texturesCount;
                    }
                });
            gltfA.materials.push(material);
        }
    }

    // Add meshes
    for (const mesh of gltfB.meshes) {
        Object.keys(mesh.primitives[0].attributes)
            .forEach((attribute) => {
                mesh.primitives[0].attributes[attribute] += accessorsCount;
            });
        mesh.primitives[0].indices += accessorsCount;
        mesh.primitives[0].material += materialsCount;
        gltfA.meshes.push(mesh);
    }

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

    // Adjust buffer size
    gltfA.buffers[0].byteLength += gltfB.buffers[0].byteLength;

    // Write output file
    const data = JSON.stringify(gltfA);
    fs.writeFileSync(outputPath, data);
}

const models = JSON.parse(fs.readFileSync(path.join(__dirname, 'models.json'), 'utf8'));
const p = (n) => path.resolve(__dirname, n);
for (const model of models) {
    fs.copyFileSync(p(model.gltf), p(model.output.gltf));
    fs.copyFileSync(p(model.bin), p(model.output.bin));
    for (const addition of model.additions) {
        combineGltf(p(model.output.gltf), p(addition.gltf), p(model.output.gltf));
        fs.appendFileSync(p(model.output.bin), fs.readFileSync(p(addition.bin)));
    }
}
