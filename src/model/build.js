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

function addNodes(pathA, nodes, outputPath) {
    const gltfA = JSON.parse(fs.readFileSync(pathA, 'utf8'));

    const nodesCount = gltfA.nodes.length;
    const meshesCount = gltfA.meshes.length;

    let nodeNum = 0;

    // Backup nodes
    const nodesBackup = nodes;

    for (const node of nodes) {
        if (!Number.isFinite(node.mesh)) {
            for (let i = 0; i < gltfA.meshes.length; i += 1) {
                if (gltfA.meshes[i].name === node.mesh) {
                    node.mesh = i;
                    break;
                }
            }
            // If the mesh is not found, use mesh 0
            if (!Number.isFinite(node.mesh)) {
                node.mesh = 0;
            }
        } else {
            node.mesh += meshesCount;
        }
        if (node.parentNode) {
            for (let i = 0; i < gltfA.nodes.length; i++) {
                if (gltfA.nodes[i].name === node.parentNode) {
                    if (gltfA.nodes[i].children) {
                        gltfA.nodes[i].children.push(gltfA.nodes.length);
                    } else {
                        gltfA.nodes[i].children = [gltfA.nodes.length];
                    }
                }
            }
            delete node.parentNode;
            for (let i = 0; i < gltfB.scenes[0].nodes.length; i++) {
                if (gltfB.scenes[0].nodes[i] === gltfA.nodes.length - nodesCount) {
                    gltfB.scenes[0].nodes.splice(i, 1);
                }
            }
        } else {
            // Add node to scene
            gltfA.scenes[0].nodes.push(nodeNum + nodesCount);
            nodeNum++;
        }
        gltfA.nodes.push(node);
    }

    // Write output file
    const data = JSON.stringify(gltfA);
    fs.writeFileSync(outputPath, data);
    // Restore nodes
    nodes = nodesBackup;
}

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
            bufferView.byteOffset += bufferSize + ((4 - (bufferSize % 4)) % 4);
        } else {
            bufferView.byteOffset = bufferSize + ((4 - (bufferSize % 4)) % 4);
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
            if (material.extensions) {
                for (const extension in material.extensions) {
                    if (!gltfA.extensionsUsed.includes(extension)) {
                        gltfA.extensionsUsed.push(extension);
                    }
                }
            }
            gltfA.materials.push(material);
        }
    }

    // Add meshes
    if (gltfB.meshes) {
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
                // If the material is not found, use material 0
                if (!Number.isFinite(mesh.primitives[0].material)) {
                    mesh.primitives[0].material = 0;
                }
            } else {
                mesh.primitives[0].material += materialsCount;
            }
            gltfA.meshes.push(mesh);
        }
    }

    // Add nodes
    if (gltfB.nodes) {
        for (const node of gltfB.nodes) {
            node.mesh += meshesCount;
            if (node.children) {
                const newChildren = [];
                for (const child of node.children) {
                    newChildren.push(child + nodesCount);
                }
                node.children = newChildren;
            }
            if (node.parentNode) {
                for (let i = 0; i < gltfA.nodes.length; i++) {
                    if (gltfA.nodes[i].name === node.parentNode) {
                        if (gltfA.nodes[i].children) {
                            gltfA.nodes[i].children.push(gltfA.nodes.length);
                        } else {
                            gltfA.nodes[i].children = [gltfA.nodes.length];
                        }
                    }
                }
                delete node.parentNode;
                for (let i = 0; i < gltfB.scenes[0].nodes.length; i++) {
                    if (gltfB.scenes[0].nodes[i] === gltfA.nodes.length - nodesCount) {
                        gltfB.scenes[0].nodes.splice(i, 1);
                    }
                }
            }
            gltfA.nodes.push(node);
        }

        // Add nodes to scene
        for (const node of gltfB.scenes[0].nodes) {
            gltfA.scenes[0].nodes.push(node + nodesCount);
        }
    }

    // Add animations
    if (gltfB.animations) {
        if (!gltfA.animations) {
            gltfA.animations = [];
        }
        for (const animation of gltfB.animations) {
            let skip = false;
            for (const channel of animation.channels) {
                if (typeof channel.target.node === 'string') {
                    for (let i = 0; i < gltfA.nodes.length; i++) {
                        if (gltfA.nodes[i].name === channel.target.node) {
                            channel.target.node = i;
                            break;
                        }
                    }
                } else {
                    channel.target.node += nodesCount;
                }
                // if we didn't find the node, skip the whole animation
                if (typeof channel.target.node === 'string') {
                    skip = true;
                }
            }
            for (const sampler of animation.samplers) {
                sampler.input += accessorsCount;
                sampler.output += accessorsCount;
            }
            if (!skip) {
                gltfA.animations.push(animation);
            }
        }
    }

    // Adjust buffer size
    gltfA.buffers[0].byteLength += gltfB.buffers[0].byteLength + ((4 - (bufferSize % 4)) % 4);

    // Write output file
    const data = JSON.stringify(gltfA);
    fs.writeFileSync(outputPath, data);
}

function replaceAccessorData(buffer, gltf, accessor, data) {
    const accessorByteOffset = accessor.byteOffset || 0;
    const bufferView = gltf.bufferViews[accessor.bufferView];
    const bufferViewByteOffset = bufferView.byteOffset || 0;
    let { byteStride } = bufferView;
    if (byteStride === undefined) {
        byteStride = AccessorType[accessor.type] * ComponentTypeSize[accessor.componentType];
    }
    const byteOffset = accessorByteOffset + bufferViewByteOffset;
    for (let i = 0; i < data.length; i += 1) {
        const item = data[i];
        for (let j = 0; j < AccessorType[accessor.type]; j += 1) {
            const index = byteOffset + (j * ComponentTypeSize[accessor.componentType]) + (i * byteStride);
            byteData.packTo(item[j], {
                bits: (ComponentTypeSize[accessor.componentType] * 8),
                signed: ComponentTypeSigned[accessor.componentType],
                fp: ComponentTypeFloat[accessor.componentType],
            }, buffer, index);
        }
    }
    return buffer;
}

function applyModifications(buffer, gltfPath, modifications) {
    const gltf = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));
    for (const mod of modifications) {
        if (!mod.accessors) {
            continue;
        }
        for (const accessorName of mod.accessors) {
            for (const accessor of gltf.accessors) {
                if (accessor.name === accessorName) {
                    buffer = replaceAccessorData(buffer, gltf, accessor, mod.data);
                }
            }
        }
    }
    return buffer;
}

function applyNodeModifications(gltfPath, outputPath, modifications) {
    const gltf = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));
    for (const mod of modifications) {
        if (!mod.node || !mod.mods) {
            continue;
        }
        for (let i = 0; i < gltf.nodes.length; i++) {
            if (mod.node === gltf.nodes[i].name) {
                for (const prop in mod.mods) {
                    if (Object.prototype.hasOwnProperty.call(mod.mods, prop)) {
                        gltf.nodes[i][prop] = mod.mods[prop];
                    }
                }
            }
        }
    }
    const data = JSON.stringify(gltf);
    fs.writeFileSync(outputPath, data);
}

function findSamplersForNode(gltf, nodeIndex) {
    const samplers = [];
    for (let i = 0; i < gltf.animations.length; i++) {
        for (let j = 0; j < gltf.animations[i].channels.length; j++) {
            const channel = gltf.animations[i].channels[j];
            if (channel.target.node === nodeIndex) {
                samplers.push(gltf.animations[i].samplers[channel.sampler]);
            }
        }
    }
    return samplers;
}

function applyOutputSamplerModifications(buffer, gltfPath, modifications) {
    const gltf = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));
    for (const mod of modifications) {
        if (!mod.node || !mod.outputSamplers) {
            continue;
        }
        for (let i = 0; i < gltf.nodes.length; i++) {
            if (mod.node === gltf.nodes[i].name) {
                const samplers = findSamplersForNode(gltf, i);
                if (samplers.length === mod.outputSamplers.length) {
                    for (let j = 0; j < samplers.length; j++) {
                        if (mod.outputSamplers[j] === null) {
                            continue;
                        }
                        buffer = replaceAccessorData(
                            buffer,
                            gltf,
                            gltf.accessors[samplers[j].output],
                            mod.outputSamplers[j],
                        );
                    }
                }
            }
        }
    }
    return buffer;
}

function splitAnimations(gltfPath, outputPath, splitData) {
    const gltf = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));

    for (let i = 0; i < gltf.animations.length; i++) {
        const anim = gltf.animations[i];
        if (splitData.animation === anim.name) {
            gltf.animations.splice(i, 1);
            for (const newAnimData of splitData.newAnimations) {
                const newAnim = {
                    name: newAnimData.name,
                    channels: newAnimData.indices.map((oldIndex, newIndex) => ({ ...anim.channels[oldIndex], sampler: newIndex })),
                    samplers: newAnimData.indices.map((oldIndex) => anim.samplers[oldIndex]),
                };
                if (newAnimData.targetNode !== undefined) {
                    const nodeIndex = gltf.nodes.findIndex((n) => n.name === newAnimData.targetNode);
                    if (nodeIndex >= 0) {
                        newAnim.channels.forEach((c) => {
                            c.target = { ...c.target, node: nodeIndex };
                        });
                    }
                }
                gltf.animations.push(newAnim);
            }
        }
    }

    const data = JSON.stringify(gltf);
    fs.writeFileSync(outputPath, data);
}

const models = JSON.parse(fs.readFileSync(path.join(__dirname, 'models.json'), 'utf8'));
const p = (n) => path.resolve(__dirname, n);
for (const model of models) {
    for (let i = 0; i < model.gltf.length; i += 1) {
        fs.copyFileSync(p(model.gltf[i]), p(model.output.gltf[i]));
        if (model.modifications) {
            applyNodeModifications(p(model.output.gltf[i]), p(model.output.gltf[i]), model.modifications);
            let modifiedBin = applyModifications(
                fs.readFileSync(p(model.bin[i])),
                p(model.gltf[i]),
                model.modifications,
            );
            modifiedBin = applyOutputSamplerModifications(
                modifiedBin,
                p(model.gltf[i]),
                model.modifications,
            );
            fs.writeFileSync(p(model.output.bin[i]), modifiedBin);
        } else {
            fs.copyFileSync(p(model.bin[i]), p(model.output.bin[i]));
        }
        for (const addition of model.additions) {
            if (addition.nodes) {
                for (let j = 0; j < addition.combineFiles.length; j += 1) {
                    if (p(model.gltf[i]) === p(addition.combineFiles[j])) {
                        // add nodes from models.json
                        addNodes(p(model.output.gltf[i]), addition.nodes, p(model.output.gltf[i]));
                    }
                }
            } else {
                combineGltf(p(model.output.gltf[i]), p(addition.gltf), p(model.output.gltf[i]));

                // add some zeroes to the end of the bin file to make sure its length is divisible by 4
                fs.appendFileSync(p(model.output.bin[i]), Buffer.alloc((4 - (fs.statSync(p(model.output.bin[i])).size % 4)) % 4));

                // add the second bin file to the end of the first one
                fs.appendFileSync(p(model.output.bin[i]), fs.readFileSync(p(addition.bin)));
            }
        }
        if (model.splitAnimations) {
            for (const split of model.splitAnimations) {
                splitAnimations(p(model.output.gltf[i]), p(model.output.gltf[i]), split);
            }
        }
    }
}
