import type { TileKind } from '../geometry/math';

/** 片库里每种磁力片的 SVG 缩略图 */
export function TileIcon(props: { kind: TileKind; color: string; size?: number }) {
  const s = props.size ?? 64;
  const stroke = 'rgba(0,0,0,0.25)';
  const common = { fill: props.color, stroke, 'stroke-width': 2, 'stroke-linejoin': 'round' as const };

  return (
    <svg width={s} height={s} viewBox="0 0 100 100">
      {props.kind === 'square' && <rect x="18" y="18" width="64" height="64" rx="6" {...common} />}
      {props.kind === 'triangle' && <polygon points="50,16 86,78 14,78" {...common} />}
      {props.kind === 'hexagon' && (
        <polygon points="50,10 85,30 85,70 50,90 15,70 15,30" {...common} />
      )}
      {props.kind === 'sector' && (
        <path d="M 20 80 L 20 20 A 60 60 0 0 1 80 80 Z" {...common} />
      )}
    </svg>
  );
}
