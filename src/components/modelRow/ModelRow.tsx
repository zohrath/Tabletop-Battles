import type { ArmyUnitModel } from "../../utils/armyImported";
import { Content, ModelIcon, Row, Stepper, StepperButton } from "./ModelRow.styles";

type ModelRowProps = {
  model: ArmyUnitModel;
  onModelCountChange: (unitId: string, modelId: string, change: number) => void;
  unitId: string;
};

export function ModelRow({
  model,
  onModelCountChange,
  unitId,
}: ModelRowProps) {
  const count = getModelCount(model.number);
  const startingNumber = getStartingModels(model);
  const stats = getUnitStats(model);

  return (
    <Row>
      <Stepper>
        <StepperButton
          aria-label={`Add one ${model.name}`}
          disabled={count >= startingNumber}
          type="button"
          onClick={() => onModelCountChange(unitId, model.id, 1)}
        >
          +
        </StepperButton>
        <ModelIcon aria-hidden="true">
          {getModelInitials(model.name)}
          <strong>{count}</strong>
        </ModelIcon>
        <StepperButton
          aria-label={`Remove one ${model.name}`}
          disabled={count === 0}
          type="button"
          onClick={() => onModelCountChange(unitId, model.id, -1)}
        >
          -
        </StepperButton>
      </Stepper>

      <Content>
        <span>{model.name}</span>
        {stats.length > 0 && (
          <ModelStats ariaLabel={`${model.name} stats`} stats={stats} />
        )}
      </Content>
    </Row>
  );
}

type ModelStat = {
  name: string;
  value: string;
};

type ModelStatsProps = {
  ariaLabel: string;
  stats: ModelStat[];
};

function ModelStats({ ariaLabel, stats }: ModelStatsProps) {
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

function getStartingModels(model: ArmyUnitModel) {
  return getModelCount(model.startingNumber, getModelCount(model.number));
}

function getModelCount(value: number | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getModelInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getUnitStats(model: ArmyUnitModel) {
  const unitProfile = model.profiles.find(
    (profile) => profile.typeName === "Unit",
  );

  return getStatsFromCharacteristics(unitProfile?.characteristics ?? []);
}

function getStatsFromCharacteristics(
  characteristics: ArmyUnitModel["profiles"][number]["characteristics"],
) {
  const statOrder = ["M", "T", "SV", "W", "LD", "OC"];

  return statOrder.flatMap((statName) => {
    const characteristic = characteristics.find(
      (stat) => stat.name.toUpperCase() === statName,
    );

    return characteristic
      ? [
          {
            name: statName === "SV" ? "Sv" : statName,
            value: characteristic.$text,
          },
        ]
      : [];
  });
}
