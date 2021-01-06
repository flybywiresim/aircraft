const fs = require('fs');

function combine_gltf(pathA, pathB, outputPath, binSize) {
    const gltfA = JSON.parse(fs.readFileSync(pathA));
    const gltfB = JSON.parse(fs.readFileSync(pathB));

    const accessorsCount = gltfA.accessors.length;
    const bufferViewsCount = gltfA.bufferViews.length;
    const materialsCount = gltfA.materials.length;
    const meshesCount = gltfA.meshes.length;
    const nodesCount = gltfA.nodes.length;
    const imagesCount = gltfA.images.length;
    const texturesCount = gltfA.textures.length;

    bufferSize = gltfA.buffers[0].byteLength;

    //Add bufferViews
    for (const bufferView of gltfB.bufferViews) {
        if (isFinite(bufferView.byteOffset)) {
            bufferView.byteOffset += bufferSize;
        } else {
            bufferView.byteOffset = bufferSize;
        }
        gltfA.bufferViews.push(bufferView);
    }

    //Add accessors
    for (const accessor of gltfB.accessors) {
        accessor.bufferView += bufferViewsCount;
        gltfA.accessors.push(accessor);
    }

    //Add textures & images
    if (gltfB.textures) {
        for (const texture of gltfB.textures) {
            if (texture.source) {
                texture.source += imagesCount;
            }
            if (texture.extensions.MSFT_texture_dds) {
                texture.extensions.MSFT_texture_dds.source += imagesCount;
            }
            gltfA.textures.push(texture);
        }
        for (const image of gltfB.images) {
            gltfA.images.push(image);
        }
    }

    //Add materials
    if (gltfB.materials) {
        for (const material of gltfB.materials) {
            for (matProperty in material) {
                if (isFinite(material[matProperty].index)) {
                    material[matProperty].index += texturesCount;
                }
                if (material[matProperty].baseColorTexture) {
                    material[matProperty].baseColorTexture.index += texturesCount;
                }
                if (material[matProperty].metallicRoughnessTexture) {
                    material[matProperty].metallicRoughnessTexture.index += texturesCount;
                }
            }
            gltfA.materials.push(material);
        }
    }

    //Add meshes
    for (const mesh of gltfB.meshes) {
        for (const attribute in mesh.primitives[0].attributes) {
            mesh.primitives[0].attributes[attribute] += accessorsCount;
        }
        mesh.primitives[0].indices += accessorsCount;
        mesh.primitives[0].material += materialsCount;
        gltfA.meshes.push(mesh);
    }

    //Add nodes
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

    //Add nodes to scene;
    for (let i = 0; i < gltfB.nodes.length; i++) {
        gltfA.scenes[0].nodes.push(i + nodesCount);
    }

    //Adjust buffer size
    gltfA.buffers[0].byteLength += gltfB.buffers[0].byteLength;

    //Write output file
    const data = JSON.stringify(gltfA);
    fs.writeFileSync(outputPath, data);
}

const models = JSON.parse(fs.readFileSync("model/models.json")).models;
for (const model of models) {
    fs.writeFileSync(model.output.gltf, fs.readFileSync(model.gltf));
    fs.copyFileSync(model.gltf, model.output.gltf);
    fs.copyFileSync(model.bin, model.output.bin);
    for (const addition of model.additions) {
        combine_gltf(model.output.gltf, addition.gltf, model.output.gltf);
        fs.appendFileSync(model.output.bin, fs.readFileSync(addition.bin, "binary"), "binary");
    }
}
