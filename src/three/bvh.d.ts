import 'three';

declare module 'three' {
  interface BufferGeometry {
    computeBoundsTree(): void;
    disposeBoundsTree(): void;
    boundsTree?: unknown;
  }
  interface Mesh {
    raycast: (raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) => void;
  }
}
