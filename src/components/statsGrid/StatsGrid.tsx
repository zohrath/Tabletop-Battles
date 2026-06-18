import type { StatsGridProps } from "../../types/armyUnitList";

export function StatsGrid({ ariaLabel, stats }: StatsGridProps) {
  return (
    <dl className="model-stats" aria-label={ariaLabel}>
      {stats.map((stat) => (
        <div key={stat.name}>
          <dt>{stat.name}</dt>
          <dd>{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
