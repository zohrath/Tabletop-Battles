import type { DetachmentPack, DetachmentStratagem } from "../../types/AppData";
import type { Stratagem } from "../../types/Stratagem";

const STRATAGEM_ICON_MODULES = import.meta.glob(["../../assets/*.png", "!../../assets/hero.png"], {
  eager: true,
  import: "default",
}) as Record<string, string>;

export const STRATAGEM_ICON_OPTIONS = Object.entries(STRATAGEM_ICON_MODULES)
  .map(([path, src]) => ({
    key: path.split("/").at(-1) ?? path,
    name: formatAssetName(path.split("/").at(-1) ?? path),
    src,
  }))
  .sort((firstIcon, secondIcon) => firstIcon.name.localeCompare(secondIcon.name));

const STRATAGEM_ICON_BY_KEY = new Map(STRATAGEM_ICON_OPTIONS.map((icon) => [icon.key, icon.src]));

export function getDetachmentStratagems(detachment: DetachmentPack | null): Stratagem[] {
  if (!detachment) {
    return [];
  }

  return detachment.stratagems.map((stratagem) => ({
    id: `${detachment.id}:${stratagem.id}`,
    detachmentKey: detachment.id,
    name: stratagem.name,
    cpCost: stratagem.cpCost,
    description: stratagem.description,
    imageSrc: getStratagemIconSrc(stratagem.imageKey),
    phases: stratagem.phases,
    source: "detachment",
    timing: stratagem.timing,
  }));
}

export function normalizeDetachmentPacks(detachments: DetachmentPack[]) {
  return detachments.map(normalizeDetachmentPack);
}

function normalizeDetachmentPack(detachment: DetachmentPack): DetachmentPack {
  return {
    id: detachment.id,
    name: detachment.name || "Unnamed Detachment",
    detachmentRule: detachment.detachmentRule ?? "",
    enhancements: detachment.enhancements ?? "",
    stratagems: (detachment.stratagems ?? []).map(normalizeDetachmentStratagem),
  };
}

function normalizeDetachmentStratagem(stratagem: DetachmentStratagem): DetachmentStratagem {
  const imageKey = typeof stratagem.imageKey === "string" ? stratagem.imageKey : undefined;

  return {
    id: stratagem.id || createId(),
    name: stratagem.name || "Unnamed Stratagem",
    cpCost: Number.isFinite(stratagem.cpCost) ? stratagem.cpCost : 1,
    description: stratagem.description ?? "",
    imageKey: STRATAGEM_ICON_BY_KEY.has(imageKey ?? "") ? imageKey : undefined,
    phases: stratagem.phases === "Any" ? "Any" : (stratagem.phases ?? "Any"),
    timing: stratagem.timing ?? "both",
  };
}

function getStratagemIconSrc(imageKey: string | undefined) {
  return imageKey ? STRATAGEM_ICON_BY_KEY.get(imageKey) : undefined;
}

function formatAssetName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}
