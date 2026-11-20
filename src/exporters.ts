import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

function download(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function exportSTL(mesh: THREE.Mesh, filename = 'organ.stl'): void {
  const exporter = new STLExporter();
  const data = exporter.parse(mesh, { binary: true }) as DataView;
  download(new Blob([data.buffer as ArrayBuffer], { type: 'application/octet-stream' }), filename);
}

export function exportGLB(mesh: THREE.Mesh, filename = 'organ.glb'): void {
  const exporter = new GLTFExporter();
  exporter.parse(
    mesh,
    (result) => {
      if (result instanceof ArrayBuffer) {
        download(new Blob([result], { type: 'model/gltf-binary' }), filename);
      }
    },
    (err) => console.error('GLB 导出失败', err),
    { binary: true },
  );
}
