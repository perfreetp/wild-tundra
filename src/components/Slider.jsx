export default function Slider(props) {
  return (
    <label class="slider-row">
      <span class="slider-label">{props.label}</span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onInput={(e) => props.onChange(parseFloat(e.currentTarget.value))}
      />
      <span class="slider-value">{props.format ? props.format(props.value) : props.value}</span>
    </label>
  );
}
