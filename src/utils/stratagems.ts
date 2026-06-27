import type { Stratagem } from "../types/Stratagem";
import type { BattlePhase, TurnOwner } from "../types/BattlePhase";
import { Phase } from "../types/Phase";
import codexDiscipline from "../assets/codexDiscipline.png";
import guidedDisruption from "../assets/guidedDisruption.png";
import shockBombardment from "../assets/shockBombardment.png";
import lightOfVengeance from "../assets/lightOfVengeance.png";
import heresyUndone from "../assets/heresyUndone.png";
import commandReroll from "../assets/commandReroll.png";
import epicChallenge from "../assets/epicChallenge.png";
import insaneBravery from "../assets/insaneBravery.png";
import grenade from "../assets/grenade.png";
import crushingImpact from "../assets/crushingImpact.png";
import rapidIngress from "../assets/rapidIngress.png";
import fireOverwatch from "../assets/fireOverwatch.png";
import smokescreen from "../assets/smokeScreen.png";
import heroicIntervention from "../assets/heroicIntervention.png";
import counteroffensive from "../assets/counterOffensive.png";

export const coreStratagems: Stratagem[] = [
  {
    id: "core:command-re-roll",
    name: "Command Re-roll",
    cpCost: 1,
    imageSrc: commandReroll,
    phases: "Any",
    source: "core",
    timing: "both",
    description:
      "A great commander can bend even the vagaries of fate and fortune to their will, the better to ensure victory.\n\nWHEN: Any phase, just after you make one of the following rolls for a friendly unit or model:\n- Advance roll\n- Charge roll\n- Damage roll\n- Hazard roll\n- Hit roll\n- Save roll\n- Wound roll\n- A roll to determine the number of attacks generated with a weapon.\n\nTARGET: That unit or model.\n\nEFFECT: You re-roll that roll. If you are rolling more than one dice together, select one of those dice to re-roll (excluding charge rolls, which you must re-roll in full).",
  },
  {
    id: "core:epic-challenge",
    name: "Epic Challenge",
    cpCost: 1,
    imageSrc: epicChallenge,
    phases: [Phase.Fight],
    source: "core",
    timing: "both",
    description:
      "The legends of the 41st millennium are replete with deadly duels between mighty champions.\n\nWHEN: Fight phase, just after a friendly CHARACTER unit is selected to fight.\n\nTARGET: That CHARACTER unit.\n\nEFFECT: Select one CHARACTER model in your unit. Until the end of the phase, that model's melee weapons have the [PRECISION] ability.",
  },
  {
    id: "core:insane-bravery",
    name: "Insane Bravery",
    cpCost: 1,
    imageSrc: insaneBravery,
    phases: [Phase.Command],
    source: "core",
    timing: "own-turn",
    description:
      "Indifferent to their own survival, these warriors hold their ground against seemingly impossible odds.\n\nWHEN: Battle-shock step of your Command phase, just before you make a battle-shock roll for a friendly unit.\n\nTARGET: That unit.\n\nEFFECT: That battle-shock roll is automatically successful.\n\nRESTRICTIONS: You cannot use this stratagem more than once per battle.",
  },
  {
    id: "core:grenade",
    name: "Grenade",
    cpCost: 1,
    imageSrc: grenade,
    phases: [Phase.Shooting],
    source: "core",
    timing: "own-turn",
    description:
      "Priming grenades or other explosives, these warriors draw back and hurl death into the enemy's midst.\n\nWHEN: Your Shooting phase.\n\nTARGET: One friendly unengaged EXPLOSIVES/GRENADES unit that is eligible to shoot and did not make an advance move this turn.\n\nEFFECT: Resolve the following sequence:\n1. Select one EXPLOSIVES/GRENADES model in your unit.\n2. Select one unengaged enemy unit within 8\" of and visible to that model.\n3. Roll six D6: for each 4+, that enemy unit suffers 1 mortal wound.",
  },
  {
    id: "core:crushing-impact",
    name: "Crushing Impact",
    cpCost: 1,
    imageSrc: crushingImpact,
    phases: [Phase.Charge],
    source: "core",
    timing: "own-turn",
    description:
      "In extremis, armoured vehicles and rampaging monsters can use their sheer size as a weapon, ramming and crushing enemies beneath their colossal bulk, though doing so risks sustaining damage in return.\n\nWHEN: Your Charge phase, just after a friendly MONSTER/VEHICLE unit ends a charge move.\n\nTARGET: That MONSTER/VEHICLE unit.\n\nEFFECT: Resolve the following sequence:\n1. Select one enemy unit engaged with your unit.\n2. Select one model in your unit engaged with that enemy unit.\n3. Roll a number of D6 equal to the T characteristic of that model: for each 1, your unit suffers 1 mortal wound; for each 5+, that enemy unit suffers 1 mortal wound (to a maximum of 6 mortal wounds per unit).",
  },
  {
    id: "core:rapid-ingress",
    name: "Rapid Ingress",
    cpCost: 1,
    imageSrc: rapidIngress,
    phases: [Phase.Movement],
    source: "core",
    timing: "opponent-turn",
    description:
      "Be it cunning strategy, potent technology or supernatural ritual, there are many means by which a commander may hasten their warriors' onset.\n\nWHEN: End of your opponent's Movement phase.\n\nTARGET: One friendly unit that is in strategic reserves (excluding AIRCRAFT).\n\nEFFECT: Your unit makes an ingress move.\n\nRESTRICTIONS: You cannot use this stratagem during the first battle round.",
  },
  {
    id: "core:fire-overwatch",
    name: "Fire Overwatch",
    cpCost: 1,
    imageSrc: fireOverwatch,
    phases: [Phase.Movement, Phase.Charge],
    source: "core",
    timing: "opponent-turn",
    description:
      "A hail of fire can drive back advancing foes.\n\nWHEN: End of your opponent's Movement phase.\n\nTARGET: One friendly unengaged unit (excluding TITANIC units).\n\nEFFECT: Your unit shoots using snap shooting.\n\nSNAP SHOOTING\nYour unit shoots as described in Making Attacks. You can only target one visible enemy unit within 24\" of your unit. Each attack only hits on an unmodified hit roll of 6, and you cannot re-roll hit rolls. After shooting, until the end of the phase, your unit is not eligible to start an action.",
  },
  {
    id: "core:smokescreen",
    name: "Smokescreen",
    cpCost: 1,
    imageSrc: smokescreen,
    phases: [Phase.Shooting],
    source: "core",
    timing: "opponent-turn",
    description:
      "Even the most skilled marksmen struggle to hit targets veiled by billowing screens of smoke.\n\nWHEN: Start of your opponent's Shooting phase.\n\nTARGET: One friendly SMOKE unit.\n\nEFFECT: Until the end of the phase, each time an attack targets either your SMOKE unit, or a unit that is not fully visible to the attacking model because of one or more models in your SMOKE unit, the target has the benefit of cover against that attack.",
  },
  {
    id: "core:heroic-intervention",
    name: "Heroic Intervention",
    cpCost: 1,
    imageSrc: heroicIntervention,
    phases: [Phase.Charge],
    source: "core",
    timing: "opponent-turn",
    description:
      "Voices raised in furious war cries, your warriors surge forth to meet the enemy's onslaught head-on.\n\nWHEN: End of your opponent's Charge phase.\n\nTARGET: One friendly unengaged unit within 12\" of one or more enemy units. You can only select a VEHICLE unit if it is a CHARACTER/WALKER unit.\n\nEFFECT: Resolve a charge with your unit. Before making the charge roll, select Leap to Defend or Into the Fray, following that mode's charge target restrictions.",
  },
  {
    id: "core:counteroffensive",
    name: "Counteroffensive",
    cpCost: 2,
    imageSrc: counteroffensive,
    phases: [Phase.Fight],
    source: "core",
    timing: "opponent-turn",
    description:
      "In close-quarters combat, the slightest hesitation can leave an opening for a swift foe to exploit.\n\nWHEN: Fight step of your opponent's Fight phase, just after an enemy unit has resolved its attacks.\n\nTARGET: One friendly unit that is eligible to fight.\n\nEFFECT: Until the end of the phase, your unit has the Fights First ability and it must be the next unit you select to fight.",
  },
];

export const bastionTaskForceStratagems: Stratagem[] = [
  {
    id: "bastion-task-force:codex-discipline",
    factionKey: "adeptus-astartes",
    detachmentKey: "bastion-task-force",
    imageSrc: codexDiscipline,
    name: "Codex Discipline",
    cpCost: 1,
    phases: [Phase.Shooting, Phase.Fight],
    source: "detachment",
    timing: "own-turn",
    description:
      "Holding to the teachings of the Codex Astartes, these warriors unleash disciplined volleys of firepower.\n\nWHEN: Your Shooting phase or the Fight phase.\n\nTARGET: One Adeptus Astartes unit from your army that has not been selected to shoot or fight this phase.\n\nEFFECT: Until the end of the phase, each time a model in your unit makes an attack that targets an enemy unit, re-roll a Hit roll of 1. If that target is auspex scanned, re-roll a Wound roll of 1 as well.",
  },
  {
    id: "bastion-task-force:guided-disruption",
    factionKey: "adeptus-astartes",
    detachmentKey: "bastion-task-force",
    imageSrc: guidedDisruption,
    name: "Guided Disruption",
    cpCost: 1,
    phases: [Phase.Shooting, Phase.Fight],
    source: "detachment",
    timing: "own-turn",
    description:
      "Employing auspex data to reveal weak points in the foe's formation, the Space Marines exploit these to sow confusion and suppress their targets.\n\nWHEN: Your Shooting phase or the Fight phase, just after an Adeptus Astartes Battleline unit from your army has finished making its attacks.\n\nTARGET: That Adeptus Astartes Battleline unit.\n\nEFFECT: When an enemy unit is auspex scanned as a result of those attacks this turn, if that enemy unit does not have the Monster or Vehicle keywords, until the start of your next turn, it is pinned. While a unit is pinned, subtract 2 from that unit's Move characteristic and subtract 2 from Charge rolls made for that unit.",
  },
  {
    id: "bastion-task-force:light-of-vengeance",
    factionKey: "adeptus-astartes",
    detachmentKey: "bastion-task-force",
    imageSrc: lightOfVengeance,
    name: "Light of Vengeance",
    cpCost: 1,
    phases: [Phase.Shooting, Phase.Fight],
    source: "detachment",
    timing: "own-turn",
    description:
      "With their frailties exposed by the harsh glare of auspex analysis, the foe are easy prey for the Space Marines' vengeful onslaught.\n\nWHEN: Your Shooting phase or the Fight phase.\n\nTARGET: One Adeptus Astartes unit from your army that has not been selected to shoot or fight this phase.\n\nEFFECT: Select the [LETHAL HITS] or [SUSTAINED HITS 1] ability. Until the end of the phase, weapons equipped by models in your unit have that ability while targeting an auspex scanned unit or if the bearer has the Battleline keyword.",
  },
  {
    id: "bastion-task-force:shock-bombardment",
    factionKey: "adeptus-astartes",
    detachmentKey: "bastion-task-force",
    imageSrc: shockBombardment,
    name: "Shock Bombardment",
    cpCost: 1,
    phases: [Phase.Shooting, Phase.Fight],
    source: "detachment",
    timing: "own-turn",
    description:
      "An auspex-guided hail of shock charges blinds the foe's targeting systems and skews their aim.\n\nWHEN: Your Shooting phase or the Fight phase, just after an Adeptus Astartes Battleline unit from your army finished making its attacks.\n\nTARGET: That Adeptus Astartes Battleline unit.\n\nEFFECT: When an enemy unit is auspex scanned as a result of those attacks this turn, until the start of your next turn, it is suppressed. While a unit is suppressed, each time a model in that unit makes an attack, subtract 1 from the Hit roll.",
  },
  {
    id: "bastion-task-force:angels-defiant",
    factionKey: "adeptus-astartes",
    detachmentKey: "bastion-task-force",
    name: "Angels Defiant",
    cpCost: 1,
    phases: [Phase.Shooting, Phase.Fight],
    phaseTimings: [
      { phase: Phase.Shooting, timing: "opponent-turn" },
      { phase: Phase.Fight, timing: "both" },
    ],
    source: "detachment",
    timing: "opponent-turn",
    description:
      "All too aware of their vital role in holding the foe at bay, these battle-brothers refuse to yield to even the most grievous of wounds.\n\nWHEN: Your opponent's Shooting phase or the Fight phase, just after an enemy unit has selected its targets.\n\nTARGET: One Adeptus Astartes Battleline unit from your army that was selected as the target of one or more of the attacking unit's attacks.\n\nEFFECT: Until the end of the phase, each time an attack targets your unit, if the Strength characteristic of that attack is greater than the Toughness characteristic of your unit, subtract 1 from the Wound roll.",
  },
  {
    id: "bastion-task-force:heresy-undone",
    factionKey: "adeptus-astartes",
    detachmentKey: "bastion-task-force",
    imageSrc: heresyUndone,
    name: "Heresy Undone",
    cpCost: 1,
    phases: [Phase.Shooting, Phase.Charge],
    source: "detachment",
    timing: "own-turn",
    description:
      "Tactical scans and cogitator analysis have revealed the enemy's debase schemes, rendering their movements easier to anticipate and counter.\n\nWHEN: Your Shooting phase or your Charge phase.\n\nTARGET: One Adeptus Astartes unit (excluding Battleline units) from your army.\n\nEFFECT: Until the end of the phase, your unit is eligible to shoot and declare a charge in a turn in which it Advanced or Fell Back. If it does, every target of that charge and every target of those attacks must be an auspex scanned unit.",
  },
];

export function getStratagemsForBattlePhase(
  stratagems: Stratagem[],
  battlePhase: BattlePhase,
) {
  return stratagems.filter(
    (stratagem) =>
      isStratagemAvailableForPhase(stratagem, battlePhase.phase) &&
      isStratagemAvailableForPlayer(
        stratagem,
        battlePhase.phase,
        battlePhase.owner,
      ),
  );
}

function isStratagemAvailableForPhase(stratagem: Stratagem, phase: Phase) {
  return stratagem.phases === "Any" || stratagem.phases.includes(phase);
}

function isStratagemAvailableForPlayer(
  stratagem: Stratagem,
  phase: Phase,
  currentOwner: TurnOwner,
) {
  const timing =
    stratagem.phaseTimings?.find((phaseTiming) => phaseTiming.phase === phase)
      ?.timing ?? stratagem.timing;

  if (timing === "both") {
    return true;
  }

  return timing === "own-turn"
    ? currentOwner === "You"
    : currentOwner === "Opponent";
}
