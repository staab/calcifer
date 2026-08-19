<script lang="ts">
  let {
    series,
    labels,
    height = 160,
    referenceValue,
  }: {
    series: { color: string; points: number[] }[];
    labels: string[];
    height?: number;
    referenceValue?: number;
  } = $props();

  const width = 400;
  const padX = 6;
  const slots = $derived(Math.max(labels.length, 1));

  const x = (i: number) =>
    slots === 1 ? width / 2 : padX + (i / (slots - 1)) * (width - 2 * padX);

  // Each series is scaled independently to its own max; 0 at bottom, max at 90% height.
  function y(v: number, seriesMax: number): number {
    if (seriesMax <= 0) return height;
    return height - (v / seriesMax) * height * 0.9;
  }

  const scaled = $derived(
    series.map((s) => {
      const max = Math.max(...s.points, 0);
      return { color: s.color, max, coords: s.points.map((v, i) => [x(i), y(v, max)] as const) };
    })
  );

  const showDots = $derived((series[0]?.points.length ?? 0) <= 14);

  const refY = $derived(
    referenceValue !== undefined && scaled[0] ? y(referenceValue, scaled[0].max) : null
  );
</script>

<div class="overflow-hidden">
  <svg
    style="width: 100%; height: {height}px"
    viewBox="0 0 {width} {height}"
    preserveAspectRatio="none"
  >
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
</div>
