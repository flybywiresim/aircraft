'use strict';

const assert = require('node:assert').strict;
const fs = require('fs');
const path = require('node:path');

const ComponentTypeSize = {
    5120: 1,
    5121: 1,
    5122: 2,
    5123: 2,
    5125: 4,
    5126: 4,
};

const AccessorType = {
    SCALAR: 1,
    VEC2: 2,
    VEC3: 3,
    VEC4: 4,
    MAT2: 4,
    MAT3: 9,
    MAT4: 16,
};

const ATTRIBUTE_ORDER = ['POSITION', 'TANGENT', 'NORMAL', 'TEXCOORD_0', 'TEXCOORD_1', 'JOINTS_0', 'WEIGHTS_0', 'COLOR_0'];

function loadGltf(gltfPath) {
    const gltf = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));
    // we have 1 buffer, or no buffers and none needed
    const haveBuffer = gltf['buffers'] && gltf['buffers'].length === 1;
    assert.ok(haveBuffer || ((!gltf['buffers'] || gltf['buffers'].length === 0) && (!gltf['accessors'] || gltf['accessors'].length === 0)));

    if (!haveBuffer) {
        return gltf;
    }

    const binFile = path.join(path.dirname(gltfPath), path.basename(gltf['buffers'][0]['uri']));
    const buffer = fs.readFileSync(binFile);

    for (const accessor of gltf['accessors']) {
        const info = getAccessorInfo(gltf, accessor);
        assert.ok(buffer.length >= (info.bufferViewOffset + info.bufferViewLength));

        accessor['data'] = Array.from({ length: info.accessorCount }).map((_, index, arr) => {
            const byteOffset = info.bufferViewOffset + info.accessorOffset + index * info.byteStride;
            assert.ok(!isNaN(byteOffset), `${info.bufferViewOffset} + ${info.accessorOffset} + ${index} * ${info.byteStride}`);
            return buffer.subarray(byteOffset, byteOffset + info.accessorElementSize);
        })
    }

    // replace accessor indices with a ref to the accessor
    const allSkins = gltf.skins || [];
    for (const skin of allSkins) {
        const accessorIndex = skin.inverseBindMatrices;
        if (accessorIndex === undefined) {
            continue;
        }

        const accessor = gltf.accessors[accessorIndex];
        assert.ok(accessor !== undefined);

        skin.inverseBindMatrices = accessor;
    }

    const allAnimations = gltf.animations || [];
    for (const anim of allAnimations) {
        const channels = anim.channels || [];
        for (const channel of channels) {
            assert.ok(channel.target !== undefined);
            channel.target.node = gltf.nodes[channel.target.node];
        }

        const samplers = anim.samplers || [];
        for (const s of samplers) {
            for (const key of ['input', 'output']) {
                const accessorIndex = s[key];
                const accessor = gltf.accessors[accessorIndex];
                assert.ok(accessor !== undefined);

                s[key] = accessor;
            }
        }
    }

    const allMeshes = gltf.meshes || [];
    for (const mesh of allMeshes) {
        for (const prim of mesh.primitives) {
            prim.indices = gltf.accessors[prim.indices];
            assert.ok(prim.indices !== undefined);

            const primAccessors = new Map(Object.keys(prim.attributes).map((attributeName) => [attributeName, gltf.accessors[prim.attributes[attributeName]]]));
            for (const [attrName, accessor] of primAccessors) {
                assert.ok(accessor !== undefined);
                prim.attributes[attrName] = accessor;
            }
        }
    }

    return gltf;
}

function saveGltf(gltfPath, gltf, debugOuput = false) {
    const buffers = [];
    const accessors = [];

    const allSkins = gltf.skins || [];
    for (const skin of allSkins) {
        const accessor = skin.inverseBindMatrices;
        if (accessor === undefined) {
            continue;
        }

        let accessorIndex = accessors.indexOf(accessor);

        if (accessors.indexOf(accessor) < 0) {
            // we need to copy this one in
            const componentSize = ComponentTypeSize[accessor['componentType']];
            const elementSize = AccessorType[accessor['type']] * componentSize;

            let bufIndex = buffers.findIndex((b) => b.type === accessor.type && b.componentType === accessor.componentType && b.usage === 'Skin');
            let buf;
            if (bufIndex === -1) {
                bufIndex = buffers.length;
                buf = {
                    name: getBufferViewName('Skin', accessor.componentType, accessor.type),
                    data: Buffer.alloc(1024),
                    type: accessor.type,
                    componentType: accessor.componentType,
                    usage: 'Skin',
                    offset: 0, // this will be the byteLength of the bufferView at the end
                    alignment: componentSize,
                }
                buffers.push(buf);
            } else {
                buf = buffers[bufIndex];
            }

            accessor.bufferView = bufIndex;

            buf.offset = getAligned(buf.offset, componentSize);
            accessor.byteOffset = buf.offset;

            for (const [index, data] of accessor.data.entries()) {
                const end = buf.offset + elementSize;
                // if the buffer is too small, double it
                if (end > buf.data.length) {
                    buf.data = Buffer.concat([buf.data, Buffer.alloc(end * 2)]);
                }
                data.copy(buf.data, buf.offset, 0, elementSize);
                buf.offset = end;
            }

            accessorIndex = accessors.length;
            delete accessor.data;
            accessors.push(accessor);
        }

        skin.inverseBindMatrices = accessorIndex;
    }

    const allAnimations = gltf.animations || [];
    for (const anim of allAnimations) {
        const channels = anim.channels || [];
        for (const channel of channels) {
            assert.ok(channel.target !== undefined);
            const targetNodeIndex = gltf.nodes.findIndex((n) => n.name === channel.target.node.name);
            assert.ok(targetNodeIndex >= 0);
            channel.target.node = targetNodeIndex;
        }

        const samplers = anim.samplers || [];
        for (const s of samplers) {
            for (const key of ['input', 'output']) {
                const accessor = s[key];

                let accessorIndex = accessors.indexOf(accessor);

                if (accessors.indexOf(accessor) < 0) {
                    // we need to copy this one in
                    const componentSize = ComponentTypeSize[accessor['componentType']];
                    const elementSize = AccessorType[accessor['type']] * componentSize;

                    let bufIndex = buffers.findIndex((b) => b.type === accessor.type && b.componentType === accessor.componentType && b.usage === 'Animation');
                    let buf;
                    if (bufIndex === -1) {
                        bufIndex = buffers.length;
                        buf = {
                            name: getBufferViewName('Animation', accessor.componentType, accessor.type),
                            data: Buffer.alloc(1024),
                            type: accessor.type,
                            componentType: accessor.componentType,
                            usage: 'Animation',
                            offset: 0, // this will be the byteLength of the bufferView at the end
                            alignment: componentSize,
                        }
                        buffers.push(buf);
                    } else {
                        buf = buffers[bufIndex];
                    }

                    accessor.bufferView = bufIndex;

                    buf.offset = getAligned(buf.offset, componentSize);
                    accessor.byteOffset = buf.offset;

                    for (const [index, data] of accessor.data.entries()) {
                        const end = buf.offset + elementSize;
                        // if the buffer is too small, double it
                        if (end > buf.data.length) {
                            buf.data = Buffer.concat([buf.data, Buffer.alloc(end * 2)]);
                        }
                        data.copy(buf.data, buf.offset, 0, elementSize);
                        buf.offset = end;
                    }

                    accessorIndex = accessors.length;
                    delete accessor.data;
                    accessors.push(accessor);
                }

                s[key] = accessorIndex;
            }
        }
    }

    // now, just the interleaved vertex data, and indices remaining

    const ALL_ATTRIBUTES = new Set(ATTRIBUTE_ORDER);

    const indicesBuffer = {
        name: "BufferViewIndex",
        data: Buffer.alloc(1024),
        offset: 0, // this will be the byteLength of the bufferView at the end
        alignment: 4,
        target: 34963,
        usage: "Index",
    }
    buffers.push(indicesBuffer);
    const vertexBuffer = {
        name: "BufferViewVertexND",
        data: Buffer.alloc(1024),
        offset: 0, // this will be the byteLength of the bufferView at the end
        alignment: 4,
        byteStride: 36,
        target: 34962,
        attributes: new Set(['POSITION', 'TANGENT', 'NORMAL', 'TEXCOORD_0', 'TEXCOORD_1', 'COLOR_0']),
        usage: "Vertex",
    };
    buffers.push(vertexBuffer);

    const findVertexBuffer = (attributes, accessors) => {
        let byteStride = 0;

        for (const k of ATTRIBUTE_ORDER) {
            const accessor = accessors.get(k);
            if (!accessor) {
                continue;
            }

            const componentSize = ComponentTypeSize[accessor.componentType];
            const elementSize = AccessorType[accessor.type] * componentSize;

            byteStride = getAligned(byteStride, componentSize);
            byteStride += elementSize;
        }

        let buf = buffers.find((b) => b.usage === "Vertex" && b.byteStride === byteStride && areSetsEqual(b.attributes, attributes));
        if (buf) {
            return buf;
        }

        buf = {
            name: `BufferViewVertex${buffers.length}`,
            data: Buffer.alloc(1024),
            offset: 0, // this will be the byteLength of the bufferView at the end
            alignment: 4,
            byteStride,
            target: 34962,
            attributes,
            usage: "Vertex",
        }
        buffers.push(buf);
        return buf;
    }

    const allMeshes = gltf.meshes || [];
    for (const mesh of allMeshes) {
        for (const prim of mesh.primitives) {
            // first deal with indices
            const indicesAccessor = prim.indices;
            assert.ok(indicesAccessor !== undefined);

            let indicesAccessorIndex = accessors.indexOf(indicesAccessor);

            if (accessors.indexOf(indicesAccessor) < 0) {
                // we need to copy this one in
                const componentSize = ComponentTypeSize[indicesAccessor['componentType']];
                const elementSize = AccessorType[indicesAccessor['type']] * componentSize;

                indicesBuffer.offset = getAligned(indicesBuffer.offset, componentSize);
                indicesAccessor.byteOffset = indicesBuffer.offset;
                indicesAccessor.bufferView = buffers.indexOf(indicesBuffer);

                for (const [index, data] of indicesAccessor.data.entries()) {
                    const end = indicesBuffer.offset + elementSize;
                    // if the buffer is too small, double it
                    if (end > indicesBuffer.data.length) {
                        indicesBuffer.data = Buffer.concat([indicesBuffer.data, Buffer.alloc(end * 2)]);
                    }
                    data.copy(indicesBuffer.data, indicesBuffer.offset, 0, elementSize);
                    indicesBuffer.offset = end;
                }

                indicesAccessorIndex = accessors.length;
                delete indicesAccessor.data;
                accessors.push(indicesAccessor);
            }

            prim.indices = indicesAccessorIndex;

            // now deal with the attribute data
            const attributes = new Set(Object.keys(prim.attributes));
            const primAccessors = new Map(Object.keys(prim.attributes).map((attributeName) => [attributeName, prim.attributes[attributeName]]));

            // find a suitable buffer for the vertex data
            let vertexBuf = vertexBuffer;
            if (!areSetsEqual(vertexBuf.attributes, attributes)) {
                vertexBuf = findVertexBuffer(attributes, primAccessors);
            }
            const vertexBufIndex = buffers.indexOf(vertexBuf);

            let firstAccessor;
            for (const k of ATTRIBUTE_ORDER) {
                if (prim.attributes[k] !== undefined) {
                    firstAccessor = prim.attributes[k];
                    break;
                }
            }
            assert.ok(firstAccessor !== undefined);

            const count = firstAccessor.count;
            assert(Object.values(prim.attributes).every((a) => a.count === count));

            // check if we need to copy out data
            const primAttrArray  = Array.from(primAccessors.values());
            const doAttributesExist = primAttrArray.some((a) => accessors.indexOf(a) >= 0);
            assert.equal(doAttributesExist, primAttrArray.every((a) => accessors.indexOf(a) >= 0));

            if (!doAttributesExist) {
                vertexBuf.offset = getAligned(vertexBuf.offset, ComponentTypeSize[firstAccessor.componentType]);

                // write interleaved data out
                for (let i = 0; i < count; i++) {
                    const vertexStartOffset = vertexBuf.offset;
                    for (const k of ATTRIBUTE_ORDER) {
                        const accessor = primAccessors.get(k);
                        if (!accessor) {
                            continue;
                        }

                        const componentSize = ComponentTypeSize[accessor.componentType];
                        const elementSize = AccessorType[accessor.type] * componentSize;

                        vertexBuf.offset = getAligned(vertexBuf.offset, componentSize);

                        if (i === 0) {
                            accessor.byteOffset = vertexBuf.offset > 0 ? vertexBuf.offset : undefined;
                            accessor.bufferView = vertexBufIndex;
                        }

                        const end = vertexBuf.offset + elementSize;
                        // if the buffer is too small, double it
                        if (end > vertexBuf.data.length) {
                            vertexBuf.data = Buffer.concat([vertexBuf.data, Buffer.alloc(end * 2)]);
                        }
                        accessor.data[i].copy(vertexBuf.data, vertexBuf.offset, 0, elementSize);

                        vertexBuf.offset = end;

                        if (i === 0) {
                            assert.ok(vertexBuf.offset - vertexStartOffset <= vertexBuf.byteStride);
                        }
                    }
                }

                primAttrArray.forEach((a) => delete a.data);
                accessors.push(...primAttrArray);
            }

            // fill accessor indices
            for (const attributeName of attributes) {
                const accessorIndex = accessors.indexOf(prim.attributes[attributeName]);
                assert.ok(accessorIndex >= 0);
                prim.attributes[attributeName] = accessorIndex;
            }
        }
    }

    gltf.accessors = accessors;

    // Remove data from accessors as we don't want to write it in the gltf file!
    assert.ok(gltf.accessors.every((a) => a.data === undefined));

    // finally reconcile and write out all the bufferViews
    let binBuffer = Buffer.alloc(1024);
    let binOffset = 0;
    const bufferViews = [];

    for (const buffer of buffers) {
        binOffset = getAligned(binOffset, buffer.alignment);

        bufferViews.push({
            buffer: 0,
            byteLength: buffer.offset,
            byteStride: buffer.byteStride, // can be undefined
            byteOffset: binOffset,
            target: buffer.target, // can be undefined
            name: buffer.name,
        });

        const end = binOffset + buffer.offset;
        if (end > binBuffer.length) {
            binBuffer = Buffer.concat([binBuffer, Buffer.alloc(end * 2)]);
        }
        buffer.data.copy(binBuffer, binOffset, 0, buffer.offset);

        binOffset = end;
    }

    gltf.bufferViews = bufferViews;

    if (binOffset > 0) {
        const gltfPathParts = path.parse(gltfPath);
        const binFileName = `${gltfPathParts.name}.bin`;
        const binFilePath = path.join(gltfPathParts.dir, binFileName);

        gltf.buffers = [{
            byteLength: binOffset,
            uri: `${gltfPathParts.name}.bin`
        }];

        fs.writeFileSync(binFilePath, binBuffer.subarray(0, binOffset));

        console.log(`Wrote ${binOffset} bytes to ${binFilePath}`);
    } else {
        gltf.buffers = [];
    }

    gltf.asset.generator = 'FlyByWire Simulations GLTF Haxx';

    const gltfData = JSON.stringify(gltf, undefined, debugOuput ? 2 : undefined);
    fs.writeFileSync(gltfPath, gltfData);
    console.log(`Wrote ${gltfPath}`);
}

function areSetsEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a.size !== b.size) {
        return false;
    }
    return [...a].every((v) => b.has(v));
  }

function getBufferViewName(usage, componentType, elementType) {
    let name = `bufferView${usage}`;

    switch (componentType) {
    case 5120:
        name += 'SignedByte';
        break;
    case 5121:
        name += 'UnsignedByte';
        break;
    case 5122:
        name += 'SignedShort';
        break;
    case 5123:
        name += 'UnsignedShort';
        break;
    case 5125:
        name += 'UnsignedInt';
        break;
    case 5126:
        name += 'Float';
        break;
    }

    switch (elementType) {
    case 'SCALAR':
        name += 'Scalar';
        break;
    case 'VEC2':
        name += 'Vec2';
        break;
    case 'VEC3':
        name += 'Vec3';
        break;
    case 'VEC4':
        name += 'Vec4';
        break;
    case 'MAT2':
        name += 'Mat2';
        break;
    case 'MAT3':
        name += 'Mat3';
        break;
    case 'MAT4':
        name += 'Mat4';
        break;
    }

    return name;
}

function getAccessorInfo(gltf, accessor, bufferView = null) {
    if (bufferView === null) {
        bufferView = gltf['bufferViews'][accessor['bufferView']];
    }
    assert.ok(bufferView);

    const componentSize = ComponentTypeSize[accessor['componentType']];

    const bufferViewOffset = bufferView['byteOffset'] || 0;
    // don't check bufferView length if bufferView provided as it's still being constructed
    const bufferViewLength = bufferView['byteLength'] || Infinity;

    const accessorAlignment = componentSize;
    const accessorElementSize = AccessorType[accessor['type']] * componentSize;
    const byteStride = bufferView['byteStride'] || accessorElementSize;
    assert.ok(!isNaN(byteStride), `${bufferView['byteStride']} || ${accessorElementSize} ${AccessorType[accessor['type']]}`);

    const accessorOffset = accessor['byteOffset'] || 0;
    const accessorCount = accessor['count'];
    const accessorLength = byteStride * (accessorCount - 1) + accessorElementSize;
    if (bufferViewLength < (accessorLength + accessorOffset)) {
        assert.fail(`${bufferViewLength} >= (${accessorLength} + ${accessorOffset}), ${accessor['name']}`);
    }

    return {
        bufferView,
        componentSize,
        bufferViewOffset,
        bufferViewLength,
        accessorElementSize,
        byteStride,
        accessorOffset,
        accessorCount,
        accessorLength,
        accessorAlignment,
    }
}

function getAligned(offset, alignment) {
    return offset + ((alignment - (offset % alignment)) % alignment);
}

function replaceNodes(baseGltf, sourceGltf, nodes, options) {
    console.log('replaceNodes', nodes);

    const materialsAdded = new Map();

    for (const nodeName of nodes) {
        const sourceNode = sourceGltf.nodes.find((n) => n.name === nodeName);
        if (!sourceNode) {
            throw new Error(`Could not find source node ${nodeName}!`);
        }

        assert.equal(sourceNode.children, undefined);

        const destinationNode = baseGltf.nodes.find((n) => n.name === nodeName);
        if (!destinationNode) {
            throw new Error(`Could not find destination node ${nodeName}!`);
        }

        assert.equal(destinationNode.children, undefined);

        const sourceMesh = sourceGltf.meshes[sourceNode.mesh];
        const destinationMesh = baseGltf.meshes[destinationNode.mesh];

        destinationMesh.primitives = [];
        for (const sourcePrimitive of sourceMesh.primitives) {
            let material;
            if (sourcePrimitive.material !== undefined) {
                if (options && options.materials === 'keep') {
                    const sourceMaterialName = sourceGltf.materials[sourcePrimitive.material].name;
                    material = baseGltf.materials.findIndex((v) => v.name === sourceMaterialName);
                    if (material < 0) {
                        throw new Error(`Could not find material ${sourceMaterialName} to keep!`);
                    }
                } else if (options && options.materials === 'add') {
                    const sourceMaterialName = sourceGltf.materials[sourcePrimitive.material].name;
                    const baseMaterialIndex = baseGltf.materials.findIndex((v) => v.name === sourceMaterialName);
                    if (materialsAdded.has(sourceMaterialName)) {
                        material = materialsAdded.get(sourceMaterialName);
                    } else if (baseMaterialIndex >= 0) {
                        throw new Error(`Material ${sourceMaterialName} already exists!`);
                    } else {
                        // add the material
                        material = copyMaterial(sourceGltf, baseGltf, sourceMaterialName);
                        materialsAdded.set(sourceMaterialName, material);
                    }
                } else {
                    throw new Error('Not yet implemented!');
                }
            }

            const newPrimitive = {
                ...sourcePrimitive,
                material,
            }
            destinationMesh.primitives.push(newPrimitive);
        }
    }
}

function findTextureIndex(gltf, imageUri) {
    return gltf.textures.findIndex((t) => gltf.images[t.extensions.MSFT_texture_dds.source].uri === imageUri);
}

function addTexture(gltf, imageUri) {
    let imageIndex = gltf.images.findIndex((i) => i.uri === imageUri);
    if (imageIndex < 0) {
        imageIndex = gltf.images.length;
        gltf.images.push({
            "uri": imageUri,
            "extras": "ASOBO_image_converted_meta"
        });
    }

    const textureIndex = gltf.textures.length;
    gltf.textures.push({
        "extensions": { "MSFT_texture_dds": { "source": imageIndex } }
    });
    return textureIndex;
}

function copyMaterial(sourceGltf, destinationGltf, materialName) {
    const sourceMaterial = sourceGltf.materials.find((v) => v.name === materialName);
    if (sourceMaterial === null) {
        throw new Error(`Could not find ${materialName} in source GLTF!`);
    }

    const newMaterial = {
        ...sourceMaterial
    };

    for (const key of ['normalTexture', 'occlusionTexture', 'emissiveTexture']) {
        if (newMaterial[key] !== undefined) {
            const sourceTexture = sourceGltf.textures[sourceMaterial[key].index];
            const imageUri = sourceGltf.images[sourceTexture.extensions.MSFT_texture_dds.source].uri;
            let textureIndex = findTextureIndex(destinationGltf, imageUri);
            if (textureIndex < 0) {
                textureIndex = addTexture(destinationGltf, imageUri);
            }
            newMaterial[key].index = textureIndex;
        }
    }

    if (newMaterial.pbrMetallicRoughness) {
        for (const key of ['baseColorTexture', 'metallicRoughnessTexture']) {
            if (newMaterial.pbrMetallicRoughness[key] !== undefined) {
                const sourceTexture = sourceGltf.textures[sourceMaterial.pbrMetallicRoughness[key].index];
                const imageUri = sourceGltf.images[sourceTexture.extensions.MSFT_texture_dds.source].uri;
                let textureIndex = findTextureIndex(destinationGltf, imageUri);
                if (textureIndex < 0) {
                    textureIndex = addTexture(destinationGltf, imageUri);
                }
                newMaterial.pbrMetallicRoughness[key].index = textureIndex;
            }
        }
    }

    if (newMaterial.extensions && newMaterial.extensions.ASOBO_material_detail_map) {
        for (const key of ['detailMetalRoughAOTexture', 'detailNormalTexture', 'detailColorTexture']) {
            if (newMaterial.extensions.ASOBO_material_detail_map[key] !== undefined) {
                const sourceTexture = sourceGltf.textures[sourceMaterial.extensions.ASOBO_material_detail_map[key].index];
                const imageUri = sourceGltf.images[sourceTexture.extensions.MSFT_texture_dds.source].uri;
                let textureIndex = findTextureIndex(destinationGltf, imageUri);
                if (textureIndex < 0) {
                    textureIndex = addTexture(destinationGltf, imageUri);
                }
                newMaterial.extensions.ASOBO_material_detail_map[key].index = textureIndex;
            }
        }
    }

    const newMaterialIndex = destinationGltf.materials.length;
    destinationGltf.materials.push(newMaterial);

    return newMaterialIndex;
}

function appendNodes(baseGltf, sourceGltf, nodes, options) {
    console.log('appendNodes', nodes);

    const materialsAdded = new Map();

    for (const nodeName of nodes) {
        const sourceNode = sourceGltf.nodes.find((n) => n.name === nodeName);
        if (!sourceNode) {
            throw new Error(`Could not find source node ${nodeName}!`);
        }

        assert.equal(sourceNode.children, undefined);

        assert.ok(sourceGltf.scenes[0].nodes.includes(sourceGltf.nodes.indexOf(sourceNode)));

        const sourceMesh = sourceGltf.meshes[sourceNode.mesh];

        const newPrimitives = [];

        for (const sourcePrimitive of sourceMesh.primitives) {
            let material;
            if (sourcePrimitive.material !== undefined) {
                if (options && options.materials === 'keep') {
                    const sourceMaterialName = sourceGltf.materials[sourcePrimitive.material].name;
                    material = baseGltf.materials.findIndex((v) => v.name === sourceMaterialName);
                    if (material < 0) {
                        throw new Error(`Could not find material ${sourceMaterialName} to keep!`);
                    }
                } else if (options && options.materials === 'add') {
                    const sourceMaterialName = sourceGltf.materials[sourcePrimitive.material].name;
                    const baseMaterialIndex = baseGltf.materials.findIndex((v) => v.name === sourceMaterialName);
                    if (materialsAdded.has(sourceMaterialName)) {
                        material = materialsAdded.get(sourceMaterialName);
                    } else if (baseMaterialIndex >= 0) {
                        throw new Error(`Material ${sourceMaterialName} already exists!`);
                    } else {
                        // add the material
                        material = copyMaterial(sourceGltf, baseGltf, sourceMaterialName);
                        materialsAdded.set(sourceMaterialName, material);
                    }
                } else {
                    throw new Error('Not yet implemented!');
                }
            }

            const newPrimitive = {
                ...sourcePrimitive,
                material,
            }
            newPrimitives.push(newPrimitive);
        }

        const newMesh = {
            name: sourceMesh.name,
            primitives: newPrimitives,
        }

        const newNode = {
            ...sourceNode,
            mesh: baseGltf.meshes.length,
        }
        baseGltf.meshes.push(newMesh);

        assert.ok(baseGltf.scenes.length === 1);
        baseGltf.scenes[0].nodes.push(baseGltf.nodes.length);
        baseGltf.nodes.push(newNode);
    }

    if (options.copyAnimations !== 'false') {
        const animsToCopy = sourceGltf.animations.filter((a) => a.channels.some((c) => nodes.indexOf(c.target.node.name) >= 0));
        assert.ok(animsToCopy.every((a) => a.channels.every((c) => nodes.indexOf(c.target.node.name) >= 0)));
        baseGltf.animations.push(...animsToCopy.map((a) => ({ ...a, channels: a.channels.map((c) => ({ ...c })),  })));
    }
}

function addExtensionsUsed(baseGltf, sourceGltf) {
    const extensionsUsed = sourceGltf.extensionsUsed || [];
    for (const extension of extensionsUsed) {
        if (baseGltf.extensionsUsed.indexOf(extension) < 0) {
            baseGltf.extensionsUsed.push(extension);
        }
    }
}

function createInstance(baseGltf, baseMeshName, newNode) {
    console.log('createInstance', baseMeshName, newNode.name);

    const meshIndex = baseGltf.meshes.findIndex((m) => m.name === baseMeshName);
    if (meshIndex < 0) {
        throw new Error(`Could not find mesh named '${baseMeshName}'`);
    }

    const existingNode = baseGltf.nodes.findIndex((n) => n.name === newNode.name);
    assert.equal(existingNode, -1, `Node ${newNode.name} already exists!`);

    assert.ok(baseGltf.scenes.length === 1);
    baseGltf.scenes[0].nodes.push(baseGltf.nodes.length);
    baseGltf.nodes.push({
        ...newNode,
        mesh: meshIndex,
    });
}

function main(args) {
    const debug = args.includes('--debug');
    if (debug) {
        args.splice(args.indexOf('--debug'), 1);
    }

    const tasks_path = args.length === 1 ? args[0] : path.join(__dirname, 'modelsv2.json');
    const tasks = JSON.parse(fs.readFileSync(tasks_path));

    const base_path = path.dirname(tasks_path);
    const resolveRelativePath = (name) => path.resolve(base_path, name);

    for (const task of tasks) {
        if (!('operations' in task) || !('base_model' in task) || !('output' in task)) {
            console.warn('Invalid task');
            continue;
        }

        const base_gltf = loadGltf(resolveRelativePath(task.base_model));
        const additional_gltfs = new Map();

        const getAdditionalGltf = (path) => additional_gltfs.get(path) || additional_gltfs.set(path, loadGltf(resolveRelativePath(path))).get(path);

        for (const operation of task.operations) {
            switch (operation.type) {
                case 'replace_nodes': {
                    const source_gltf = getAdditionalGltf(operation.file);
                    if (!source_gltf) {
                        console.error('Could not load', source_gltf);
                        return 1;
                    }
                    replaceNodes(base_gltf, source_gltf, operation.nodes, operation.options);
                    addExtensionsUsed(base_gltf, source_gltf);
                }
                break;
                case 'append_nodes': {
                    const source_gltf = getAdditionalGltf(operation.file);
                    if (!source_gltf) {
                        console.error('Could not load', source_gltf);
                        return 1;
                    }
                    appendNodes(base_gltf, source_gltf, operation.nodes, operation.options);
                    addExtensionsUsed(base_gltf, source_gltf);
                }
                break;
                case "create_instance": {
                    createInstance(base_gltf, operation.mesh, operation.node);
                }
            }
        }

        saveGltf(resolveRelativePath(task.output), base_gltf, debug);
    }

    return 0;
}

process.exit(main(process.argv.slice(2)))
