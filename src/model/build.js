'use strict';

const fs = require('fs');
const path = require('path');
const byteData = require('byte-data');

const ComponentTypeSize = {
    5120: 1,
    5121: 1,
    5122: 2,
    5123: 2,
    5125: 4,
    5126: 4,
};

const ComponentTypeSigned = {
    5120: true,
    5121: false,
    5122: true,
    5123: false,
    5125: false,
    5126: true,
};

const ComponentTypeFloat = {
    5120: false,
    5121: false,
    5122: true,
    5123: true,
    5125: false,
    5126: true,
};

const AccessorType = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
};

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
        // workaround to allow added meshes to use existing materials
        if (!Number.isFinite(mesh.primitives[0].material)) {
            for (let i = 0; i < gltfA.materials.length; i += 1) {
                if (gltfA.materials[i].name === mesh.primitives[0].material) {
                    mesh.primitives[0].material = i;
                    break;
                }
            }
        } else {
            mesh.primitives[0].material += materialsCount;
        }
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

function applyModifications(buffer, gltfPath, modifications) {
    const gltf = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));
    for (const mod of modifications) {
        for (const accessorName of mod.accessors) {
            for (const accessor of gltf.accessors) {
                if (accessor.name === accessorName) {
                    const accessorByteOffset = accessor.byteOffset || 0;
                    const bufferView = gltf.bufferViews[accessor.bufferView];
                    const bufferViewByteOffset = bufferView.byteOffset || 0;
                    const { byteStride } = bufferView;
                    const byteOffset = accessorByteOffset + bufferViewByteOffset;
                    for (let i = 0; i < mod.data.length; i += 1) {
                        const item = mod.data[i];
                        for (let j = 0; j < AccessorType[accessor.type]; j += 1) {
                            // eslint-disable-next-line max-len
                            const index = byteOffset + (j * ComponentTypeSize[accessor.componentType]) + (i * byteStride);
                            byteData.packTo(item[j], {
                                bits: (ComponentTypeSize[accessor.componentType] * 8),
                                signed: ComponentTypeSigned[accessor.componentType],
                                fp: ComponentTypeFloat[accessor.componentType],
                            }, buffer, index);
                        }
                    }
                }
            }
        }
    }
    return buffer;
}

const models = JSON.parse(fs.readFileSync(path.join(__dirname, 'models.json'), 'utf8'));
const p = (n) => path.resolve(__dirname, n);
for (const model of models) {
    fs.copyFileSync(p(model.gltf), p(model.output.gltf));
    if (model.modifications) {
        const modifiedBin = applyModifications(
            fs.readFileSync(p(model.bin)),
            p(model.gltf),
            model.modifications,
        );
        fs.writeFileSync(p(model.output.bin), modifiedBin);
    } else {
        fs.copyFileSync(p(model.bin), p(model.output.bin));
    }
    for (const addition of model.additions) {
        combineGltf(p(model.output.gltf), p(addition.gltf), p(model.output.gltf));
        fs.appendFileSync(p(model.output.bin), fs.readFileSync(p(addition.bin)));
    }
}
