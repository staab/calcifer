<script lang="ts">
  let {
    series,
    labels,
    height = 160,
    referenceValue,
  }: {
    series: { color: string; points: number[]; axis?: 'left' | 'right' }[];
    labels: string[];
    height?: number;
    referenceValue?: number;
  } = $props();

  const width = 400;
  const padX = 6;
  const slots = $derived(Math.max(labels.length, 1));

  const x = (i: number) =>
    slots === 1 ? width / 2 : padX + (i / (slots - 1)) * (width - 2 * padX);

  // round up to a clean half-magnitude step so axis labels are readable numbers
  function niceCeil(v: number): number {
    if (v <= 0) return 0;
    const step = 10 ** Math.floor(Math.log10(v)) / 2;
    return Math.ceil(v / step) * step;
  }

  // all left-axis series share one scale (grams); right-axis series share another (kcal)
  const axisMax = $derived.by(() => {
    const left = series.filter((s) => (s.axis ?? 'left') === 'left').flatMap((s) => s.points);
    const right = series.filter((s) => s.axis === 'right').flatMap((s) => s.points);
    return {
      left: niceCeil(Math.max(...left, 0)),
      right: niceCeil(Math.max(...right, referenceValue ?? 0, 0)),
    };
  });

  function y(v: number, max: number): number {
    return max <= 0 ? height : height - (v / max) * height;
  }

  const scaled = $derived(
    series.map((s) => ({
      color: s.color,
      coords: s.points.map(
        (v, i) => [x(i), y(v, s.axis === 'right' ? axisMax.right : axisMax.left)] as const
      ),
    }))
  );

  const showDots = $derived((series[0]?.points.length ?? 0) <= 14);
  const refY = $derived(referenceValue !== undefined ? y(referenceValue, axisMax.right) : null);

  const gridFractions = [0.5, 1];
</script>

<div class="relative overflow-hidden">
  <svg
    style="width: 100%; height: {height}px"
    viewBox="0 0 {width} {height}"
    preserveAspectRatio="none"
  >
    {#each gridFractions as f (f)}
      <line
        x1="0"
        y1={(1 - f) * height}
        x2={width}
        y2={(1 - f) * height}
        stroke="var(--border)"
        stroke-width="1"
      />
    {/each}
    {#if refY !== null && refY >= 0 && refY <= height}
      <line
        x1="0"
        y1={refY}
        x2={width}
        y2={refY}
        stroke="var(--muted-foreground)"
        stroke-width="1"
        stroke-dasharray="4 4"
      />
    {/if}
    {#each scaled as s (s.color)}
      <polyline
        points={s.coords.map(([px, py]) => `${px},${py}`).join(' ')}
        fill="none"
        stroke={s.color}
        stroke-width="2"
        stroke-linejoin="round"
      />
      {#if showDots}
        {#each s.coords as [px, py], i (i)}
          <circle cx={px} cy={py} r="3" fill={s.color} />
        {/each}
      {/if}
    {/each}
  </svg>
  {#each gridFractions as f (f)}
    {#if axisMax.left > 0}
      <span class="absolute left-0 text-[10px] text-muted-foreground" style="top: {(1 - f) * height}px">
        {Math.round(axisMax.left * f)} g
      </span>
    {/if}
    {#if axisMax.right > 0}
      <span class="absolute right-0 text-[10px] text-muted-foreground" style="top: {(1 - f) * height}px">
        {Math.round(axisMax.right * f)} kcal
      </span>
    {/if}
  {/each}
</div>
