/**
 * 生成测试资源（纯 Node，无浏览器依赖）：
 * - tests/assets/sample-line.glb：含多个 Box 网格的最小合法 GLB
 * - tests/assets/sample-centerline.json：中心线点列
 * GLB 结构遵循 glTF 2.0：12 字节头 + JSON chunk + BIN chunk。
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(join(ROOT, 'tests', 'assets'), { recursive: true });

const CUBE = {
  positions: new Float32Array([
    -0.5, -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, -0.5, -0.5, 0.5, -0.5,
    -0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
  ]),
  normals: new Float32Array([
    0, 0, -1, 0, 0, -1, 0, 0, -1, 0, 0, -1,
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  ]),
  indices: new Uint16Array([
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1,
    1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 4, 0, 3, 4, 3, 7,
  ]),
};

const GL_ARRAY = 34962;
const GL_ELEMENT = 34963;
const GL_FLOAT = 5126;
const GL_USHORT = 5123;

function pad4(buf) {
  const pad = (4 - (buf.length % 4)) % 4;
  return pad ? Buffer.concat([buf, Buffer.alloc(pad)]) : buf;
}

function buildGlb(boxes) {
  const binParts = [];
  const bufferViews = [];
  const accessors = [];
  const meshes = [];
  const nodes = [];
  let offset = 0;

  const appendView = (typedArray, target) => {
    const buf = pad4(Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength));
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, target });
    const viewIndex = bufferViews.length - 1;
    offset += buf.length;
    binParts.push(buf);
    return viewIndex;
  };

  const appendAccessor = (viewIndex, componentType, type, count, minMax) => {
    const acc = { bufferView: viewIndex, componentType, count, type };
    if (minMax) Object.assign(acc, minMax);
    accessors.push(acc);
    return accessors.length - 1;
  };

  boxes.forEach((box) => {
    const posView = appendView(CUBE.positions, GL_ARRAY);
    const nrmView = appendView(CUBE.normals, GL_ARRAY);
    const idxView = appendView(CUBE.indices, GL_ELEMENT);
    const posAcc = appendAccessor(posView, GL_FLOAT, 'VEC3', 8, {
      min: [-0.5, -0.5, -0.5],
      max: [0.5, 0.5, 0.5],
    });
    const nrmAcc = appendAccessor(nrmView, GL_FLOAT, 'VEC3', 8);
    const idxAcc = appendAccessor(idxView, GL_USHORT, 'SCALAR', 36);
    meshes.push({
      primitives: [
        { attributes: { POSITION: posAcc, NORMAL: nrmAcc }, indices: idxAcc, material: 0 },
      ],
    });
    nodes.push({ mesh: meshes.length - 1, translation: box.translation, scale: box.scale });
  });

  const bin = Buffer.concat(binParts);
  const gltf = {
    asset: { version: '2.0', generator: 'e2e-asset' },
    scene: 0,
    scenes: [{ nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes,
    materials: [
      {
        pbrMetallicRoughness: {
          baseColorFactor: [0.55, 0.6, 0.68, 1],
          metallicFactor: 0.1,
          roughnessFactor: 0.8,
        },
      },
    ],
    accessors,
    bufferViews,
    buffers: [{ byteLength: bin.length }],
  };

  const jsonBuf = pad4(Buffer.from(JSON.stringify(gltf), 'utf8'));
  const total = 12 + 8 + jsonBuf.length + 8 + bin.length;
  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, bin]);
}

const boxes = [];
for (let i = 0; i < 12; i++) boxes.push({ translation: [i * 20, 3, 6], scale: [20, 6, 0.5] });
boxes.push({ translation: [120, 0, 0], scale: [240, 0.4, 4] });
const glb = buildGlb(boxes);
writeFileSync(join(ROOT, 'tests', 'assets', 'sample-line.glb'), glb);
console.log('GLB written:', glb.length, 'bytes,', boxes.length, 'meshes');

const points = [];
for (let x = 0; x <= 1200; x += 40) {
  const z = Math.sin(x * 0.006) * 60 + Math.sin(x * 0.017) * 12;
  const y = Math.sin(x * 0.004) * 1.5 + 0.6;
  points.push([Number(x.toFixed(2)), Number(y.toFixed(2)), Number(z.toFixed(2))]);
}
writeFileSync(join(ROOT, 'tests', 'assets', 'sample-centerline.json'), JSON.stringify({ points }, null, 2));
console.log('Centerline written:', points.length, 'points');
