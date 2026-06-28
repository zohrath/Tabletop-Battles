import { useCallback, useEffect, useState } from "react";
import "./App.css";
import { neonAuthClient, neonAuthEnabled } from "./auth";
import { ArmyUnitList } from "./components/ArmyUnitList";
import { Header } from "./components/header/Header";
import { Modal } from "./components/modal/Modal";
import { PhaseIndicator } from "./components/phaseIndicator/PhaseIndicator";
import { StratagemsIndicator } from "./components/stratagemsIndicator/StratagemsIndicator";
import { StratagemsToggleButton } from "./components/stratagemsIndicator/StratagemsIndicator.styles";
import {
  TURN_OWNERS,
  TURNS,
  type BattlePhase,
  type TurnOwner,
  type Turn,
} from "./types/BattlePhase";
import { Phase } from "./types/Phase";
import type { Stratagem, StratagemTiming } from "./types/Stratagem";
import type { ArmyImported } from "./types/armyImported";
import {
  extractArmyRules,
  extractArmyUnits,
  type ArmyRule,
  type ArmyUnit,
} from "./utils/armyImported";
import {
  bastionTaskForceStratagems,
  coreStratagems,
  getStratagemsForBattlePhase,
} from "./utils/stratagems";
import {
  getActiveWeapons,
  getWeaponKey,
  getWeaponKeywords,
} from "./utils/weapon";

const SAVED_ARMIES_STORAGE_KEY = "tabletop-battles.saved-armies";
const DETACHMENTS_STORAGE_KEY = "tabletop-battles.detachments";
const AUTH_TOKEN_STORAGE_KEY = "tabletop-battles.auth-token";
const AUTH_PROVIDER_STORAGE_KEY = "tabletop-battles.auth-provider";
const PHASES = Object.values(Phase) as Phase[];

type AppPage = "battle" | "armies" | "armyRule" | "admin";

const INITIAL_BATTLE_PHASE: BattlePhase = {
  phase: PHASES[0],
  owner: TURN_OWNERS[0],
  turn: TURNS[0],
};

type SavedArmy = {
  id: string;
  importedAt: string;
  name: string;
  selectedDetachmentId?: string;
  selectedArmyRuleChoiceId?: string;
  sourceFileName: string;
  armyRules: ArmyRule[];
  units: ArmyUnit[];
};

type DetachmentPack = {
  id: string;
  name: string;
  detachmentRule: string;
  enhancements: string;
  stratagems: DetachmentStratagem[];
};

type DetachmentStratagem = {
  id: string;
  name: string;
  cpCost: number;
  description: string;
  phases: Phase[] | "Any";
  timing: StratagemTiming;
};

type WeaponKeywordTarget = {
  unitId: string;
  weaponKey: string;
};

type ChipUndo = {
  label: string;
  undo: () => void;
};

type AuthAccount = {
  id: string;
  provider: AuthProvider;
  username: string;
  isAdmin: boolean;
};

type LocalAuthAccount = Omit<AuthAccount, "provider">;

type AuthProvider = "local" | "neon";

type SessionStatus = "checking" | "logged-in" | "logged-out";

type AdminAccount = {
  id: string;
  username: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

type ArmyListsResponse = {
  armies: SavedArmy[];
};

type DetachmentsResponse = {
  detachments: DetachmentPack[];
};

type UnitOverridePayload = {
  abilities: ArmyUnit["abilities"];
  weaponKeywordOverrides: NonNullable<ArmyUnit["weaponKeywordOverrides"]>;
};

const BUILT_IN_DETACHMENTS: DetachmentPack[] = [
  {
    id: "bastion-task-force",
    name: "Bastion Task Force",
    detachmentRule: "",
    enhancements: "",
    stratagems: bastionTaskForceStratagems.map((stratagem) => ({
      id: stratagem.id,
      name: stratagem.name,
      cpCost: stratagem.cpCost,
      description: stratagem.description,
      phases: stratagem.phases,
      timing: stratagem.timing,
    })),
  },
];

function App() {
  const [authToken, setAuthToken] = useState(
    () => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? "",
  );
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(() =>
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || neonAuthEnabled
      ? "checking"
      : "logged-out",
  );
  const [authProvider, setAuthProvider] = useState<AuthProvider>(() =>
    localStorage.getItem(AUTH_PROVIDER_STORAGE_KEY) === "neon"
      ? "neon"
      : "local",
  );
  const [authAccount, setAuthAccount] = useState<AuthAccount | null>(null);
  const [savedArmies, setSavedArmies] = useState<SavedArmy[]>(loadSavedArmies);
  const [detachmentPacks, setDetachmentPacks] =
    useState<DetachmentPack[]>(loadDetachmentPacks);
  const [activeArmyId, setActiveArmyId] = useState(
    () => savedArmies[0]?.id ?? "",
  );
  const [page, setPage] = useState<AppPage>("battle");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [firstTurnOwner, setFirstTurnOwner] = useState<TurnOwner | null>(null);
  const [firstTurnModalOpen, setFirstTurnModalOpen] = useState(false);
  const [detachmentEditorOpen, setDetachmentEditorOpen] = useState(false);
  const [selectedDetachmentDetail, setSelectedDetachmentDetail] =
    useState<DetachmentPack | null>(null);
  const [addAbilityUnitId, setAddAbilityUnitId] = useState<string | null>(null);
  const [removeAbilityUnitId, setRemoveAbilityUnitId] = useState<string | null>(
    null,
  );
  const [addWeaponKeywordTarget, setAddWeaponKeywordTarget] =
    useState<WeaponKeywordTarget | null>(null);
  const [removeWeaponKeywordTarget, setRemoveWeaponKeywordTarget] =
    useState<WeaponKeywordTarget | null>(null);
  const [stratagemsIndicatorOpen, setStratagemsIndicatorOpen] =
    useState(false);
  const [battlePhase, setBattlePhase] =
    useState<BattlePhase>(INITIAL_BATTLE_PHASE);

  const activeArmy =
    savedArmies.find((army) => army.id === activeArmyId) ?? null;
  const selectedDetachment =
    detachmentPacks.find(
      (detachment) => detachment.id === activeArmy?.selectedDetachmentId,
    ) ?? null;
  const detachmentStratagems = getDetachmentStratagems(selectedDetachment);
  const turnOwners = getTurnOwners(firstTurnOwner);
  const visibleCoreStratagems = getStratagemsForBattlePhase(
    coreStratagems,
    battlePhase,
  );
  const visibleDetachmentStratagems = getStratagemsForBattlePhase(
    detachmentStratagems,
    battlePhase,
  );

  useEffect(() => {
    if (sessionStatus !== "logged-in" || !authToken) {
      return;
    }

    let cancelled = false;

    async function loadDatabaseArmies() {
      try {
        const { armies } = await apiRequest<ArmyListsResponse>(
          "/api/army-lists",
          {
            token: authToken,
          },
        );
        const normalizedArmies = normalizeSavedArmies(armies);

        if (cancelled) {
          return;
        }

        if (normalizedArmies.length > 0) {
          setSavedArmies(normalizedArmies);
          localStorage.setItem(
            SAVED_ARMIES_STORAGE_KEY,
            JSON.stringify(normalizedArmies),
          );
          setActiveArmyId((currentArmyId) =>
            normalizedArmies.some((army) => army.id === currentArmyId)
              ? currentArmyId
              : normalizedArmies[0]?.id ?? "",
          );
          return;
        }

        const localArmies = loadSavedArmies();

        if (localArmies.length === 0) {
          return;
        }

        const imported = await apiRequest<ArmyListsResponse>("/api/army-lists", {
          body: { armies: localArmies },
          method: "POST",
          token: authToken,
        });
        const importedArmies = normalizeSavedArmies(imported.armies);

        if (!cancelled) {
          setSavedArmies(importedArmies);
          localStorage.setItem(
            SAVED_ARMIES_STORAGE_KEY,
            JSON.stringify(importedArmies),
          );
          setActiveArmyId((currentArmyId) =>
            importedArmies.some((army) => army.id === currentArmyId)
              ? currentArmyId
              : importedArmies[0]?.id ?? "",
          );
        }
      } catch {
        if (!cancelled) {
          setError("Could not sync saved armies. Using browser storage.");
        }
      }
    }

    void loadDatabaseArmies();

    return () => {
      cancelled = true;
    };
  }, [authToken, sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== "logged-in" || !authToken) {
      return;
    }

    let cancelled = false;

    async function loadDatabaseDetachments() {
      try {
        const { detachments } = await apiRequest<DetachmentsResponse>(
          "/api/detachments",
          {
            token: authToken,
          },
        );
        const normalizedDetachments = mergeBuiltInDetachments(detachments);

        if (cancelled) {
          return;
        }

        if (detachments.length > 0) {
          setDetachmentPacks(normalizedDetachments);
          localStorage.setItem(
            DETACHMENTS_STORAGE_KEY,
            JSON.stringify(normalizedDetachments),
          );
          return;
        }

        const localDetachments = loadDetachmentPacks();

        if (localDetachments.length === 0) {
          return;
        }

        const imported = await apiRequest<DetachmentsResponse>(
          "/api/detachments",
          {
            body: { detachments: localDetachments },
            method: "POST",
            token: authToken,
          },
        );
        const importedDetachments = mergeBuiltInDetachments(
          imported.detachments,
        );

        if (!cancelled) {
          setDetachmentPacks(importedDetachments);
          localStorage.setItem(
            DETACHMENTS_STORAGE_KEY,
            JSON.stringify(importedDetachments),
          );
        }
      } catch {
        if (!cancelled) {
          setError("Could not sync detachments. Using browser storage.");
        }
      }
    }

    void loadDatabaseDetachments();

    return () => {
      cancelled = true;
    };
  }, [authToken, sessionStatus]);
  const hasVisibleStratagems =
    visibleCoreStratagems.length > 0 || visibleDetachmentStratagems.length > 0;
  const addAbilityUnit = getSavedUnit(activeArmy, addAbilityUnitId);
  const removeAbilityUnit = getSavedUnit(activeArmy, removeAbilityUnitId);
  const addWeaponKeywordUnit = getSavedUnit(
    activeArmy,
    addWeaponKeywordTarget?.unitId ?? null,
  );
  const removeWeaponKeywordUnit = getSavedUnit(
    activeArmy,
    removeWeaponKeywordTarget?.unitId ?? null,
  );
  const addWeaponKeywordName = addWeaponKeywordUnit && addWeaponKeywordTarget
    ? getWeaponName(addWeaponKeywordUnit, addWeaponKeywordTarget.weaponKey)
    : "";
  const removeWeaponKeywordNames =
    removeWeaponKeywordUnit && removeWeaponKeywordTarget
      ? getVisibleWeaponKeywordNames(
          removeWeaponKeywordUnit,
          removeWeaponKeywordTarget.weaponKey,
        )
      : [];

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (authToken) {
        try {
          const { account } = await apiRequest<{ account: LocalAuthAccount }>(
            "/api/session",
            {
              token: authToken,
            },
          );

          if (!cancelled) {
            setAuthProvider("local");
            setAuthAccount({ ...account, provider: "local" });
            setSessionStatus("logged-in");
          }
          return;
        } catch {
          localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
          setAuthToken("");
        }
      }

      if (neonAuthClient) {
        const account = await getNeonSessionAccount();

        if (account) {
          if (!cancelled) {
            localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, "neon");
            setAuthProvider("neon");
            setAuthAccount(account);
            setSessionStatus("logged-in");
          }
          return;
        }
      }

      if (!cancelled) {
        localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY);
        setAuthAccount(null);
        setSessionStatus("logged-out");
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [authToken]);

  async function login(username: string, password: string) {
    const result = await apiRequest<{ account: AuthAccount; token: string }>(
      "/api/login",
      {
        body: { username, password },
        method: "POST",
      },
    );

    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, result.token);
    localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, "local");
    setAuthToken(result.token);
    setAuthProvider("local");
    setAuthAccount({ ...result.account, provider: "local" });
    setSessionStatus("logged-in");
  }

  async function loginWithNeon(email: string, password: string) {
    if (!neonAuthClient) {
      throw new Error("Neon Auth is not configured.");
    }

    const result = await neonAuthClient.signIn.email({ email, password });

    if (result.error) {
      throw new Error(result.error.message ?? "Could not sign in.");
    }

    const account = await getNeonSessionAccount();

    if (!account) {
      throw new Error("Neon Auth did not return an active session.");
    }

    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, "neon");
    setAuthToken("");
    setAuthProvider("neon");
    setAuthAccount(account);
    setSessionStatus("logged-in");
  }

  async function signUpWithNeon(email: string, password: string) {
    if (!neonAuthClient) {
      throw new Error("Neon Auth is not configured.");
    }

    const result = await neonAuthClient.signUp.email({
      email,
      name: email.split("@")[0] || "User",
      password,
    });

    if (result.error) {
      throw new Error(result.error.message ?? "Could not create account.");
    }

    const account = await getNeonSessionAccount();

    if (!account) {
      throw new Error("Account created. Sign in to continue.");
    }

    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, "neon");
    setAuthToken("");
    setAuthProvider("neon");
    setAuthAccount(account);
    setSessionStatus("logged-in");
  }

  async function logout() {
    if (authProvider === "neon" && neonAuthClient) {
      await neonAuthClient.signOut().catch(() => undefined);
    }

    if (authToken) {
      await apiRequest("/api/logout", {
        method: "POST",
        token: authToken,
      }).catch(() => undefined);
    }

    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(AUTH_PROVIDER_STORAGE_KEY);
    setAuthToken("");
    setAuthProvider("local");
    setAuthAccount(null);
    setSessionStatus("logged-out");
  }

  async function handleRosterFile(file: File | undefined) {
    setError("");

    if (!file) {
      return;
    }

    try {
      const army = JSON.parse(await file.text()) as ArmyImported;
      const armyRules = extractArmyRules(army);

      console.log("Imported army stratagems", armyRules);

      const savedArmy: SavedArmy = {
        id: createId(),
        importedAt: new Date().toISOString(),
        name: army.roster.name || file.name,
        armyRules,
        sourceFileName: file.name,
        units: extractArmyUnits(army),
      };

      updateSavedArmies((currentArmies) => [savedArmy, ...currentArmies]);
      setActiveArmyId(savedArmy.id);
      setPage("battle");
      setMenuOpen(false);
    } catch {
      setError("Could not read this roster JSON.");
      setMenuOpen(false);
    }
  }

  function changeModelCount(unitId: string, modelId: string, change: number) {
    if (!activeArmy) {
      return;
    }

    updateSavedArmies((currentArmies) =>
      currentArmies.map((army) => {
        if (army.id !== activeArmy.id) {
          return army;
        }

        return {
          ...army,
          units: army.units.map((unit) => {
            if (unit.id !== unitId) {
              return unit;
            }

            return {
              ...unit,
              models: unit.models.map((model) => {
                if (model.id !== modelId) {
                  return model;
                }

                const currentCount = getModelCount(model.number);
                const startingCount = getModelCount(
                  model.startingNumber,
                  currentCount,
                );

                return {
                  ...model,
                  number: clamp(currentCount + change, 0, startingCount),
                };
              }),
            };
          }),
        };
      }),
    );
  }

  function renameArmy(armyId: string, name: string) {
    updateSavedArmies((currentArmies) =>
      currentArmies.map((army) =>
        army.id === armyId ? { ...army, name } : army,
      ),
    );
  }

  function deleteArmy(armyId: string) {
    void deleteSavedArmyFromDatabase(armyId);
    updateSavedArmies((currentArmies) => {
      const nextArmies = currentArmies.filter((army) => army.id !== armyId);

      if (armyId === activeArmyId) {
        setActiveArmyId(nextArmies[0]?.id ?? "");
      }

      return nextArmies;
    });
  }

  function openArmy(armyId: string) {
    setActiveArmyId(armyId);
    setPage("battle");
  }

  function chooseArmyRule(choiceId: string) {
    if (!activeArmy) {
      return;
    }

    updateSavedArmies((currentArmies) =>
      currentArmies.map((army) =>
        army.id === activeArmy.id
          ? { ...army, selectedArmyRuleChoiceId: choiceId }
          : army,
      ),
    );
  }

  function updateDetachmentPacks(
    getNextDetachments: (
      currentDetachments: DetachmentPack[],
    ) => DetachmentPack[],
  ) {
    setDetachmentPacks((currentDetachments) => {
      const nextDetachments = getNextDetachments(currentDetachments);
      localStorage.setItem(
        DETACHMENTS_STORAGE_KEY,
        JSON.stringify(nextDetachments),
      );
      void syncDetachmentsToDatabase(nextDetachments);
      return nextDetachments;
    });
  }

  function saveDetachmentEditor(
    nextDetachments: DetachmentPack[],
    selectedDetachmentId: string,
    deletedDetachmentIds: string[],
  ) {
    deletedDetachmentIds.forEach((detachmentId) => {
      void deleteDetachmentFromDatabase(detachmentId);
    });

    updateDetachmentPacks(() => nextDetachments);

    if (activeArmy) {
      updateSavedArmies((currentArmies) =>
        currentArmies.map((army) =>
          army.id === activeArmy.id
            ? {
                ...army,
                selectedDetachmentId: selectedDetachmentId || undefined,
              }
            : army,
        ),
      );
    }

    setDetachmentEditorOpen(false);
  }

  async function syncDetachmentsToDatabase(nextDetachments: DetachmentPack[]) {
    if (sessionStatus !== "logged-in" || !authToken) {
      return;
    }

    await apiRequest("/api/detachments", {
      body: { detachments: nextDetachments },
      method: "POST",
      token: authToken,
    }).catch(() => undefined);
  }

  async function deleteDetachmentFromDatabase(detachmentId: string) {
    if (sessionStatus !== "logged-in" || !authToken) {
      return;
    }

    await apiRequest(`/api/detachments/${detachmentId}`, {
      method: "DELETE",
      token: authToken,
    }).catch(() => undefined);
  }

  function updateActiveArmyUnitOverride(
    unitId: string,
    getNextUnit: (unit: ArmyUnit) => ArmyUnit,
  ) {
    if (!activeArmy) {
      return null;
    }

    const currentUnit =
      activeArmy.units.find((unit) => unit.id === unitId) ?? null;

    if (!currentUnit) {
      return null;
    }

    const nextUnit = getNextUnit(currentUnit);

    updateSavedArmies(
      (currentArmies) =>
        currentArmies.map((army) =>
          army.id === activeArmy.id
            ? {
                ...army,
                units: army.units.map((unit) =>
                  unit.id === unitId ? nextUnit : unit,
                ),
              }
            : army,
        ),
      { syncDatabase: false },
    );
    void saveUnitOverrideToDatabase(activeArmy.id, nextUnit);

    return nextUnit;
  }

  function changeAbilityDisplayName(
    unitId: string,
    abilityId: string,
    displayName: string,
  ) {
    updateActiveArmyUnitOverride(unitId, (unit) => ({
      ...unit,
      abilities: (unit.abilities ?? []).map((ability) =>
        ability.id === abilityId
          ? {
              ...ability,
              displayName: displayName.trim() || undefined,
            }
          : ability,
      ),
    }));
  }

  function addUnitAbility(unitId: string) {
    setAddAbilityUnitId(unitId);
  }

  function saveUnitAbility(unitId: string, name: string, description: string) {
    if (!name.trim()) {
      return;
    }

    updateActiveArmyUnitOverride(unitId, (unit) => ({
      ...unit,
      abilities: [
        ...(unit.abilities ?? []),
        {
          id: createId(),
          name: name.trim(),
          description: description.trim(),
          userAdded: true,
        },
      ].sort(compareSavedAbilities),
    }));
    setAddAbilityUnitId(null);
  }

  function removeUnitAbility(unitId: string) {
    setRemoveAbilityUnitId(unitId);
  }

  function deleteUnitAbility(unitId: string, name: string): ChipUndo | undefined {
    if (!name.trim() || !activeArmy) {
      return undefined;
    }

    const unit = activeArmy.units.find((currentUnit) => currentUnit.id === unitId);
    const removedAbility = (unit?.abilities ?? []).find(
      (ability) =>
        normalizeName(ability.displayName || ability.name) === normalizeName(name),
    );

    if (!removedAbility) {
      return undefined;
    }

    updateActiveArmyUnitOverride(unitId, (currentUnit) => ({
      ...currentUnit,
      abilities: (currentUnit.abilities ?? []).filter(
        (ability) =>
          normalizeName(ability.displayName || ability.name) !==
          normalizeName(name),
      ),
    }));

    return {
      label: removedAbility.displayName || removedAbility.name,
      undo: () => restoreUnitAbility(unitId, removedAbility),
    };
  }

  function restoreUnitAbility(
    unitId: string,
    ability: ArmyUnit["abilities"][number],
  ) {
    updateActiveArmyUnitOverride(unitId, (unit) => {
      const abilities = unit.abilities ?? [];

      if (
        abilities.some((currentAbility) => currentAbility.id === ability.id)
      ) {
        return unit;
      }

      return {
        ...unit,
        abilities: [...abilities, ability].sort(compareSavedAbilities),
      };
    });
  }

  function addWeaponKeyword(unitId: string, weaponKey: string) {
    setAddWeaponKeywordTarget({ unitId, weaponKey });
  }

  function saveWeaponKeyword(
    unitId: string,
    weaponKey: string,
    name: string,
    description: string,
  ) {
    if (!name.trim()) {
      return;
    }

    updateActiveArmyUnitOverride(unitId, (unit) => ({
      ...unit,
      weaponKeywordOverrides: upsertWeaponKeywordOverride(
        unit.weaponKeywordOverrides ?? [],
        weaponKey,
        name.trim(),
        description.trim(),
      ),
    }));
    setAddWeaponKeywordTarget(null);
  }

  function removeWeaponKeyword(unitId: string, weaponKey: string) {
    setRemoveWeaponKeywordTarget({ unitId, weaponKey });
  }

  function deleteWeaponKeyword(
    unitId: string,
    weaponKey: string,
    name: string,
  ): ChipUndo | undefined {
    if (!name.trim() || !activeArmy) {
      return undefined;
    }

    const unit = activeArmy.units.find((currentUnit) => currentUnit.id === unitId);
    const weapon = unit
      ? getActiveWeapons(unit).find(
          (currentWeapon) => getWeaponKey(currentWeapon) === weaponKey,
        )
      : null;
    const removedKeyword = weapon
      ? getWeaponKeywords(weapon).find(
          (keyword) => normalizeName(keyword.name) === normalizeName(name),
        )
      : null;

    if (!removedKeyword) {
      return undefined;
    }

    updateActiveArmyUnitOverride(unitId, (unit) => ({
      ...unit,
      weaponKeywordOverrides: removeWeaponKeywordOverride(
        unit.weaponKeywordOverrides ?? [],
        weaponKey,
        name.trim(),
      ),
    }));

    return {
      label: removedKeyword.name,
      undo: () =>
        restoreWeaponKeyword(unitId, weaponKey, {
          description: removedKeyword.description ?? "",
          name: removedKeyword.name,
        }),
    };
  }

  function restoreWeaponKeyword(
    unitId: string,
    weaponKey: string,
    keyword: { description: string; name: string },
  ) {
    updateActiveArmyUnitOverride(unitId, (unit) => ({
      ...unit,
      weaponKeywordOverrides: restoreWeaponKeywordOverride(
        unit.weaponKeywordOverrides ?? [],
        weaponKey,
        keyword,
      ),
    }));
  }

  function updateSavedArmies(
    getNextArmies: (currentArmies: SavedArmy[]) => SavedArmy[],
    options: { syncDatabase?: boolean } = {},
  ) {
    setSavedArmies((currentArmies) => {
      const nextArmies = getNextArmies(currentArmies);
      localStorage.setItem(
        SAVED_ARMIES_STORAGE_KEY,
        JSON.stringify(nextArmies),
      );
      if (options.syncDatabase ?? true) {
        void syncSavedArmiesToDatabase(nextArmies);
      }
      return nextArmies;
    });
  }

  async function syncSavedArmiesToDatabase(nextArmies: SavedArmy[]) {
    if (sessionStatus !== "logged-in" || !authToken) {
      return;
    }

    await apiRequest("/api/army-lists", {
      body: { armies: nextArmies },
      method: "POST",
      token: authToken,
    }).catch(() => undefined);
  }

  async function deleteSavedArmyFromDatabase(armyId: string) {
    if (sessionStatus !== "logged-in" || !authToken) {
      return;
    }

    await apiRequest(`/api/army-lists/${armyId}`, {
      method: "DELETE",
      token: authToken,
    }).catch(() => undefined);
  }

  async function saveUnitOverrideToDatabase(armyId: string, unit: ArmyUnit) {
    if (sessionStatus !== "logged-in" || !authToken) {
      return;
    }

    await apiRequest(
      `/api/army-lists/${encodeURIComponent(armyId)}/units/${encodeURIComponent(
        unit.id,
      )}/override`,
      {
        body: { override: getUnitOverridePayload(unit) },
        method: "PUT",
        token: authToken,
      },
    ).catch(() => undefined);
  }

  if (sessionStatus === "checking") {
    return (
      <main className="login-shell">
        <p>Checking session...</p>
      </main>
    );
  }

  if (sessionStatus === "logged-out") {
    return (
      <LoginScreen
        neonAuthEnabled={neonAuthEnabled}
        onLocalLogin={login}
        onNeonLogin={loginWithNeon}
        onNeonSignUp={signUpWithNeon}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="toolbar">
        <div>
          <h1>
            {page === "armies"
              ? "Armies"
              : page === "admin"
                ? "Admin"
                : activeArmy?.name || "Army Units"}
          </h1>
          <p>
            {page === "armies"
              ? `${savedArmies.length} saved armies`
              : page === "admin"
                ? `Logged in as ${authAccount?.username}`
                : page === "armyRule"
                ? getSelectedArmyRuleChoice(activeArmy)?.name ||
                  "Choose an army rule"
                : activeArmy?.sourceFileName ||
                  "Choose a NewRecruit or BattleScribe roster JSON."}
          </p>
        </div>

        <div className="app-menu">
          <button
            aria-controls="app-menu-panel"
            aria-expanded={menuOpen}
            aria-label="Open menu"
            className="menu-button"
            type="button"
            onClick={() => setMenuOpen((isOpen) => !isOpen)}
          >
            <span />
            <span />
            <span />
          </button>

          {menuOpen && (
            <div className="menu-panel" id="app-menu-panel">
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  setPage("armies");
                  setMenuOpen(false);
                }}
              >
                Armies
              </button>
              <button
                className="menu-item"
                disabled={!activeArmy}
                type="button"
                onClick={() => {
                  setPage("battle");
                  setMenuOpen(false);
                }}
              >
                Current Army
              </button>
              <button
                className="menu-item"
                disabled={!activeArmy}
                type="button"
                onClick={() => {
                  setPage("armyRule");
                  setMenuOpen(false);
                }}
              >
                Army Rule
              </button>
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  setFirstTurnModalOpen(true);
                  setMenuOpen(false);
                }}
              >
                First Turn
              </button>
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  setDetachmentEditorOpen(true);
                  setMenuOpen(false);
                }}
              >
                Detachments
              </button>
              {authAccount?.isAdmin && (
                <button
                  className="menu-item"
                  type="button"
                  onClick={() => {
                    setPage("admin");
                    setMenuOpen(false);
                  }}
                >
                  Admin
                </button>
              )}
              <label className="menu-item">
                <input
                  accept="application/json,.json"
                  type="file"
                  onChange={(event) =>
                    void handleRosterFile(event.target.files?.[0])
                  }
                />
                Import JSON
              </label>
              <button
                className="menu-item"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  void logout();
                }}
              >
                Log Out
              </button>
            </div>
          )}
        </div>
      </section>

      {error && <p className="error-message">{error}</p>}

      {page === "armies" ? (
        <ArmyManager
          activeArmyId={activeArmyId}
          armies={savedArmies}
          onDeleteArmy={deleteArmy}
          onOpenArmy={openArmy}
          onRenameArmy={renameArmy}
        />
      ) : page === "armyRule" ? (
        <ArmyRulePage army={activeArmy} onChooseArmyRule={chooseArmyRule} />
      ) : page === "admin" ? (
        <AdminDatabasePage authToken={authToken} />
      ) : (
        <>
          {!firstTurnOwner && (
            <p className="turn-owner-warning">Choose who started first turn.</p>
          )}
          {hasVisibleStratagems && (
            <StratagemsToggleButton
              aria-expanded={stratagemsIndicatorOpen}
              aria-label={
                stratagemsIndicatorOpen
                  ? "Hide stratagems indicator"
                  : "Show stratagems indicator"
              }
              type="button"
              onClick={() => setStratagemsIndicatorOpen((isOpen) => !isOpen)}
            >
              <span aria-hidden="true" />
            </StratagemsToggleButton>
          )}
          {stratagemsIndicatorOpen && visibleDetachmentStratagems.length > 0 && (
            <StratagemsIndicator stratagems={visibleDetachmentStratagems} />
          )}
          {stratagemsIndicatorOpen && visibleCoreStratagems.length > 0 && (
            <StratagemsIndicator
              side="right"
              stratagems={visibleCoreStratagems}
            />
          )}
          <SelectedArmyRuleBanner army={activeArmy} />
          <SelectedDetachmentChip
            detachment={selectedDetachment}
            onOpen={() => {
              if (selectedDetachment) {
                setSelectedDetachmentDetail(selectedDetachment);
              }
            }}
          />
          <ArmyUnitList
            onAddAbility={addUnitAbility}
            onAddWeaponKeyword={addWeaponKeyword}
            onAbilityDisplayNameChange={changeAbilityDisplayName}
            onModelCountChange={changeModelCount}
            onRemoveAbility={removeUnitAbility}
            onRemoveWeaponKeyword={removeWeaponKeyword}
            units={activeArmy?.units ?? []}
          />
        </>
      )}
      {firstTurnModalOpen && (
        <Modal
          ariaLabelledBy="first-turn-modal-title"
          closeAriaLabel="Close first turn settings"
          header={
            <Header
              title="First Turn"
              titleId="first-turn-modal-title"
              subtitle="Choose who started the battle round sequence."
            />
          }
          maxWidth={480}
          onClose={() => setFirstTurnModalOpen(false)}
        >
          <fieldset className="first-turn-options">
            <legend>First player</legend>
            {TURN_OWNERS.map((owner) => (
              <label key={owner}>
                <input
                  checked={firstTurnOwner === owner}
                  name="first-turn-owner"
                  type="radio"
                  value={owner}
                  onChange={() => {
                    setFirstTurnOwner(owner);
                    setBattlePhase((current) => ({
                      ...current,
                      owner:
                        current.owner === TURN_OWNERS[0]
                          ? owner
                          : getOtherTurnOwner(owner),
                    }));
                  }}
                />
                <span>{owner === "You" ? "You started" : "Opponent started"}</span>
              </label>
            ))}
          </fieldset>
        </Modal>
      )}
      {detachmentEditorOpen && (
        <Modal
          ariaLabelledBy="detachment-editor-title"
          closeAriaLabel="Close detachment editor"
          header={
            <Header
              title="Detachments"
              titleId="detachment-editor-title"
              subtitle="Create detachments, paste rules, and attach stratagems."
            />
          }
          maxWidth={760}
          onClose={() => setDetachmentEditorOpen(false)}
        >
          <DetachmentEditor
            activeArmy={activeArmy}
            detachmentPacks={detachmentPacks}
            onCancel={() => setDetachmentEditorOpen(false)}
            onSave={saveDetachmentEditor}
          />
        </Modal>
      )}
      {selectedDetachmentDetail && (
        <Modal
          ariaLabelledBy="detachment-detail-title"
          closeAriaLabel="Close detachment details"
          header={
            <Header
              title={selectedDetachmentDetail.name}
              titleId="detachment-detail-title"
              subtitle="Detachment"
            />
          }
          maxWidth={640}
          onClose={() => setSelectedDetachmentDetail(null)}
        >
          <DetachmentDetail detachment={selectedDetachmentDetail} />
        </Modal>
      )}
      {addAbilityUnit && (
        <AddChipModal
          closeAriaLabel="Close ability editor"
          descriptionLabel="Ability description"
          itemType="Ability"
          onClose={() => setAddAbilityUnitId(null)}
          onSubmit={(name, description) =>
            saveUnitAbility(addAbilityUnit.id, name, description)
          }
          subtitle={addAbilityUnit.name}
          title="Add Ability"
        />
      )}
      {removeAbilityUnit && (
        <RemoveChipModal
          closeAriaLabel="Close ability remover"
          emptyText="No abilities to remove."
          itemNames={(removeAbilityUnit.abilities ?? []).map(
            (ability) => ability.displayName || ability.name,
          )}
          onClose={() => setRemoveAbilityUnitId(null)}
          onRemove={(name) => deleteUnitAbility(removeAbilityUnit.id, name)}
          subtitle={removeAbilityUnit.name}
          title="Remove Ability"
        />
      )}
      {addWeaponKeywordTarget && addWeaponKeywordUnit && (
        <AddChipModal
          closeAriaLabel="Close keyword editor"
          descriptionLabel="Keyword description"
          itemType="Keyword"
          onClose={() => setAddWeaponKeywordTarget(null)}
          onSubmit={(name, description) =>
            saveWeaponKeyword(
              addWeaponKeywordTarget.unitId,
              addWeaponKeywordTarget.weaponKey,
              name,
              description,
            )
          }
          subtitle={`${addWeaponKeywordUnit.name} - ${addWeaponKeywordName}`}
          title="Add Keyword"
        />
      )}
      {removeWeaponKeywordTarget && removeWeaponKeywordUnit && (
        <RemoveChipModal
          closeAriaLabel="Close keyword remover"
          emptyText="No keywords to remove."
          itemNames={removeWeaponKeywordNames}
          onClose={() => setRemoveWeaponKeywordTarget(null)}
          onRemove={(name) =>
            deleteWeaponKeyword(
              removeWeaponKeywordTarget.unitId,
              removeWeaponKeywordTarget.weaponKey,
              name,
            )
          }
          subtitle={`${removeWeaponKeywordUnit.name} - ${getWeaponName(
            removeWeaponKeywordUnit,
            removeWeaponKeywordTarget.weaponKey,
          )}`}
          title="Remove Keyword"
        />
      )}
      <PhaseIndicator
        battlePhase={battlePhase}
        canGoNext={!isLastBattlePhase(battlePhase, turnOwners)}
        canGoPrevious={!isFirstBattlePhase(battlePhase, turnOwners)}
        canReset={isLastBattlePhase(battlePhase, turnOwners)}
        onNextPhase={() =>
          setBattlePhase((current) =>
            isLastBattlePhase(current, turnOwners)
              ? current
              : getNextBattlePhase(current, turnOwners),
          )
        }
        onPreviousPhase={() =>
          setBattlePhase((current) =>
            isFirstBattlePhase(current, turnOwners)
              ? current
              : getPreviousBattlePhase(current, turnOwners),
          )
        }
        onReset={() => setBattlePhase(getInitialBattlePhase(turnOwners))}
      />
    </main>
  );
}

type LoginScreenProps = {
  neonAuthEnabled: boolean;
  onLocalLogin: (username: string, password: string) => Promise<void>;
  onNeonLogin: (email: string, password: string) => Promise<void>;
  onNeonSignUp: (email: string, password: string) => Promise<void>;
};

function LoginScreen({
  neonAuthEnabled,
  onLocalLogin,
  onNeonLogin,
  onNeonSignUp,
}: LoginScreenProps) {
  const [mode, setMode] = useState<AuthProvider>(
    neonAuthEnabled ? "neon" : "local",
  );
  const [username, setUsername] = useState(neonAuthEnabled ? "" : "admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isNeonMode = mode === "neon";

  return (
    <main className="login-shell">
      <form
        className="login-panel"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          setIsSubmitting(true);
          const submit = isNeonMode
            ? isSignUp
              ? onNeonSignUp(username, password)
              : onNeonLogin(username, password)
            : onLocalLogin(username, password);

          submit
            .catch((loginError: Error) => setError(loginError.message))
            .finally(() => setIsSubmitting(false));
        }}
      >
        <div>
          <h1>Tabletop Battles</h1>
          <p>Log in to continue.</p>
        </div>
        {neonAuthEnabled && (
          <div className="login-mode-tabs" role="tablist" aria-label="Login type">
            <button
              aria-selected={mode === "neon"}
              onClick={() => {
                setMode("neon");
                setUsername("");
                setPassword("");
                setError("");
              }}
              role="tab"
              type="button"
            >
              Neon
            </button>
            <button
              aria-selected={mode === "local"}
              onClick={() => {
                setMode("local");
                setUsername("admin");
                setPassword("admin");
                setError("");
              }}
              role="tab"
              type="button"
            >
              Local Admin
            </button>
          </div>
        )}
        <label>
          <span>{isNeonMode ? "Email" : "Username"}</span>
          <input
            autoComplete={isNeonMode ? "email" : "username"}
            type={isNeonMode ? "email" : "text"}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>
        <label>
          <span>Password</span>
          <input
            autoComplete="current-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error && <p className="error-message">{error}</p>}
        <button disabled={isSubmitting} type="submit">
          {isSubmitting
            ? isSignUp && isNeonMode
              ? "Creating..."
              : "Logging in..."
            : isSignUp && isNeonMode
              ? "Create Account"
              : "Log In"}
        </button>
        {isNeonMode && (
          <button
            className="login-link-button"
            onClick={() => {
              setError("");
              setIsSignUp((current) => !current);
            }}
            type="button"
          >
            {isSignUp
              ? "Already have a Neon account? Log in"
              : "Need a Neon account? Create one"}
          </button>
        )}
      </form>
    </main>
  );
}

function AdminDatabasePage({ authToken }: { authToken: string }) {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [error, setError] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const isLocal = isLocalApp();

  const loadAccounts = useCallback(async () => {
    setError("");
    try {
      const result = await apiRequest<{ accounts: AdminAccount[] }>(
        "/api/admin/accounts",
        { token: authToken },
      );
      setAccounts(result.accounts);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }, [authToken]);

  useEffect(() => {
    const loadTimer = window.setTimeout(() => {
      void loadAccounts();
    }, 0);

    return () => window.clearTimeout(loadTimer);
  }, [loadAccounts]);

  async function createAccount() {
    setError("");
    try {
      await apiRequest("/api/admin/accounts", {
        body: {
          username: newUsername,
          password: newPassword,
          isAdmin: newIsAdmin,
        },
        method: "POST",
        token: authToken,
      });
      setNewUsername("");
      setNewPassword("");
      setNewIsAdmin(false);
      await loadAccounts();
    } catch (createError) {
      setError((createError as Error).message);
    }
  }

  async function updateAccount(account: AdminAccount, password: string) {
    setError("");
    try {
      await apiRequest(`/api/admin/accounts/${account.id}`, {
        body: {
          username: account.username,
          password,
          isAdmin: account.is_admin,
        },
        method: "PUT",
        token: authToken,
      });
      await loadAccounts();
    } catch (updateError) {
      setError((updateError as Error).message);
    }
  }

  async function deleteAccount(accountId: string) {
    setError("");
    try {
      await apiRequest(`/api/admin/accounts/${accountId}`, {
        method: "DELETE",
        token: authToken,
      });
      await loadAccounts();
    } catch (deleteError) {
      setError((deleteError as Error).message);
    }
  }

  return (
    <section className="admin-page" aria-label="Database admin">
      {error && <p className="error-message">{error}</p>}
      <article className="admin-card">
        <h2>Accounts</h2>
        {isLocal ? (
          <div className="admin-create-row">
            <input
              placeholder="Username"
              value={newUsername}
              onChange={(event) => setNewUsername(event.target.value)}
            />
            <input
              placeholder="Password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
            <label>
              <input
                checked={newIsAdmin}
                type="checkbox"
                onChange={(event) => setNewIsAdmin(event.target.checked)}
              />
              Admin
            </label>
            <button
              disabled={!newUsername.trim() || !newPassword}
              type="button"
              onClick={() => void createAccount()}
            >
              Create
            </button>
          </div>
        ) : (
          <p className="admin-note">Account creation is only available locally.</p>
        )}
        <div className="admin-account-list">
          {accounts.map((account) => (
            <AdminAccountRow
              account={account}
              key={account.id}
              onDelete={() => void deleteAccount(account.id)}
              onSave={(nextAccount, password) =>
                void updateAccount(nextAccount, password)
              }
            />
          ))}
        </div>
      </article>
    </section>
  );
}

type AdminAccountRowProps = {
  account: AdminAccount;
  onDelete: () => void;
  onSave: (account: AdminAccount, password: string) => void;
};

function AdminAccountRow({ account, onDelete, onSave }: AdminAccountRowProps) {
  const [username, setUsername] = useState(account.username);
  const [isAdmin, setIsAdmin] = useState(account.is_admin);
  const [password, setPassword] = useState("");

  return (
    <article className="admin-account-row">
      <input
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />
      <input
        placeholder="New password"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <label>
        <input
          checked={isAdmin}
          type="checkbox"
          onChange={(event) => setIsAdmin(event.target.checked)}
        />
        Admin
      </label>
      <button
        type="button"
        onClick={() =>
          onSave({ ...account, username, is_admin: isAdmin }, password)
        }
      >
        Save
      </button>
      <button type="button" onClick={onDelete}>
        Delete
      </button>
    </article>
  );
}

function getInitialBattlePhase(turnOwners: readonly TurnOwner[]): BattlePhase {
  return {
    phase: PHASES[0],
    owner: turnOwners[0],
    turn: TURNS[0],
  };
}

function getTurnOwners(firstOwner: TurnOwner | null): readonly TurnOwner[] {
  return firstOwner ? [firstOwner, getOtherTurnOwner(firstOwner)] : TURN_OWNERS;
}

function getOtherTurnOwner(owner: TurnOwner): TurnOwner {
  return owner === "You" ? "Opponent" : "You";
}

function isFirstBattlePhase(
  current: BattlePhase,
  turnOwners: readonly TurnOwner[],
) {
  return (
    current.turn === TURNS[0] &&
    current.owner === turnOwners[0] &&
    current.phase === PHASES[0]
  );
}

function isLastBattlePhase(
  current: BattlePhase,
  turnOwners: readonly TurnOwner[],
) {
  return (
    current.turn === TURNS[TURNS.length - 1] &&
    current.owner === turnOwners[turnOwners.length - 1] &&
    current.phase === PHASES[PHASES.length - 1]
  );
}

function getPreviousBattlePhase(
  current: BattlePhase,
  turnOwners: readonly TurnOwner[],
): BattlePhase {
  if (current.phase !== PHASES[0]) {
    return {
      ...current,
      phase: getPreviousPhase(current.phase),
    };
  }

  const isFirstOwner = current.owner === turnOwners[0];

  return {
    phase: PHASES[PHASES.length - 1],
    owner: isFirstOwner
      ? turnOwners[turnOwners.length - 1]
      : getPreviousTurnOwner(current.owner, turnOwners),
    turn: isFirstOwner ? getPreviousTurn(current.turn) : current.turn,
  };
}

function getNextBattlePhase(
  current: BattlePhase,
  turnOwners: readonly TurnOwner[],
): BattlePhase {
  if (current.phase !== PHASES[PHASES.length - 1]) {
    return {
      ...current,
      phase: getNextPhase(current.phase),
    };
  }

  const isLastOwner = current.owner === turnOwners[turnOwners.length - 1];

  return {
    phase: PHASES[0],
    owner: isLastOwner ? turnOwners[0] : getNextTurnOwner(current.owner, turnOwners),
    turn: isLastOwner ? getNextTurn(current.turn) : current.turn,
  };
}

function getPreviousTurn(currentTurn: Turn) {
  const currentIndex = TURNS.indexOf(currentTurn);
  const previousIndex = currentIndex <= 0 ? TURNS.length - 1 : currentIndex - 1;

  return TURNS[previousIndex];
}

function getNextTurn(currentTurn: Turn) {
  const currentIndex = TURNS.indexOf(currentTurn);
  const nextIndex = currentIndex >= TURNS.length - 1 ? 0 : currentIndex + 1;

  return TURNS[nextIndex];
}

function getPreviousTurnOwner(
  currentOwner: TurnOwner,
  turnOwners: readonly TurnOwner[],
) {
  const currentIndex = turnOwners.indexOf(currentOwner);
  const previousIndex =
    currentIndex <= 0 ? turnOwners.length - 1 : currentIndex - 1;

  return turnOwners[previousIndex];
}

function getNextTurnOwner(
  currentOwner: TurnOwner,
  turnOwners: readonly TurnOwner[],
) {
  const currentIndex = turnOwners.indexOf(currentOwner);
  const nextIndex =
    currentIndex >= turnOwners.length - 1 ? 0 : currentIndex + 1;

  return turnOwners[nextIndex];
}

function getPreviousPhase(currentPhase: Phase) {
  const currentIndex = PHASES.indexOf(currentPhase);
  const previousIndex =
    currentIndex <= 0 ? PHASES.length - 1 : currentIndex - 1;

  return PHASES[previousIndex];
}

function getNextPhase(currentPhase: Phase) {
  const currentIndex = PHASES.indexOf(currentPhase);
  const nextIndex = currentIndex >= PHASES.length - 1 ? 0 : currentIndex + 1;

  return PHASES[nextIndex];
}

type ArmyRulePageProps = {
  army: SavedArmy | null;
  onChooseArmyRule: (choiceId: string) => void;
};

function ArmyRulePage({ army, onChooseArmyRule }: ArmyRulePageProps) {
  if (!army) {
    return <p className="empty-state">Import or open an army first.</p>;
  }

  const rules = army.armyRules ?? [];
  const choiceRules = rules.filter((rule) => rule.choices.length > 0);

  if (rules.length === 0) {
    return <p className="empty-state">No army rules found in this import.</p>;
  }

  return (
    <section className="army-rule-page" aria-label="Army rule selection">
      {choiceRules.length > 0
        ? choiceRules.map((rule) => (
            <article className="army-rule-card" key={rule.id}>
              <h2>{rule.name}</h2>
              <label>
                <span>Chosen rule</span>
                <select
                  value={army.selectedArmyRuleChoiceId ?? ""}
                  onChange={(event) => onChooseArmyRule(event.target.value)}
                >
                  <option value="">None selected</option>
                  {rule.choices.map((choice) => (
                    <option key={choice.id} value={choice.id}>
                      {choice.name}
                    </option>
                  ))}
                </select>
              </label>
              <SelectedArmyRuleDescription army={army} />
            </article>
          ))
        : rules.map((rule) => (
            <article className="army-rule-card" key={rule.id}>
              <h2>{rule.name}</h2>
              <p>{rule.description}</p>
            </article>
          ))}
    </section>
  );
}

function SelectedArmyRuleBanner({ army }: { army: SavedArmy | null }) {
  const selectedChoice = getSelectedArmyRuleChoice(army);

  if (!selectedChoice) {
    return null;
  }

  return (
    <section className="selected-army-rule">
      <span>Army rule</span>
      <strong>{selectedChoice.name}</strong>
    </section>
  );
}

function SelectedDetachmentChip({
  detachment,
  onOpen,
}: {
  detachment: DetachmentPack | null;
  onOpen: () => void;
}) {
  if (!detachment) {
    return null;
  }

  return (
    <section className="selected-detachment">
      <span>Detachment</span>
      <ul className="weapon-keywords">
        <li>
          <button type="button" onClick={onOpen}>
            {detachment.name}
          </button>
        </li>
      </ul>
    </section>
  );
}

type DetachmentEditorProps = {
  activeArmy: SavedArmy | null;
  detachmentPacks: DetachmentPack[];
  onCancel: () => void;
  onSave: (
    detachmentPacks: DetachmentPack[],
    selectedDetachmentId: string,
    deletedDetachmentIds: string[],
  ) => void;
};

function DetachmentEditor({
  activeArmy,
  detachmentPacks,
  onCancel,
  onSave,
}: DetachmentEditorProps) {
  const [detachmentSelectorOpen, setDetachmentSelectorOpen] = useState(false);
  const [draftDetachments, setDraftDetachments] = useState(() =>
    detachmentPacks.map(cloneDetachmentPack),
  );
  const [draftSelectedDetachmentId, setDraftSelectedDetachmentId] = useState(
    () => activeArmy?.selectedDetachmentId ?? "",
  );
  const [deletedDetachmentIds, setDeletedDetachmentIds] = useState<string[]>([]);
  const selectedDraftDetachment =
    draftDetachments.find(
      (detachment) => detachment.id === draftSelectedDetachmentId,
    ) ?? null;

  function createDraftDetachment() {
    const id = createId();
    setDraftDetachments((currentDetachments) => [
      ...currentDetachments,
      {
        id,
        name: "New Detachment",
        detachmentRule: "",
        enhancements: "",
        stratagems: [],
      },
    ]);
    setDraftSelectedDetachmentId(id);
  }

  function updateDraftDetachment(nextDetachment: DetachmentPack) {
    setDraftDetachments((currentDetachments) =>
      currentDetachments.map((detachment) =>
        detachment.id === nextDetachment.id ? nextDetachment : detachment,
      ),
    );
  }

  function deleteDraftDetachment(detachmentId: string) {
    setDraftDetachments((currentDetachments) =>
      currentDetachments.filter((detachment) => detachment.id !== detachmentId),
    );
    setDeletedDetachmentIds((currentIds) =>
      currentIds.includes(detachmentId)
        ? currentIds
        : [...currentIds, detachmentId],
    );

    if (draftSelectedDetachmentId === detachmentId) {
      setDraftSelectedDetachmentId("");
    }
  }

  return (
    <section className="detachment-editor">
      <div className="detachment-selector">
        <span>Current army detachment</span>
        <button
          aria-expanded={detachmentSelectorOpen}
          className="detachment-selector-current"
          disabled={!activeArmy}
          type="button"
          onClick={() => setDetachmentSelectorOpen((isOpen) => !isOpen)}
        >
          {getDraftSelectedDetachmentName(
            draftSelectedDetachmentId,
            draftDetachments,
          )}
        </button>
        {detachmentSelectorOpen && (
          <div
            aria-label="Current army detachment options"
            className="detachment-option-list"
            role="listbox"
          >
            <button
              aria-selected={!activeArmy?.selectedDetachmentId}
              disabled={!activeArmy}
              role="option"
              type="button"
              onClick={() => {
                setDraftSelectedDetachmentId("");
                setDetachmentSelectorOpen(false);
              }}
            >
              None selected
            </button>
            {draftDetachments.map((detachment) => (
              <button
                aria-selected={draftSelectedDetachmentId === detachment.id}
                disabled={!activeArmy}
                key={detachment.id}
                role="option"
                type="button"
                onClick={() => {
                  setDraftSelectedDetachmentId(detachment.id);
                  setDetachmentSelectorOpen(false);
                }}
              >
                {detachment.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <button type="button" onClick={createDraftDetachment}>
        Add Detachment
      </button>

      {selectedDraftDetachment ? (
        <div className="detachment-list">
          <DetachmentEditorCard
            detachment={selectedDraftDetachment}
            key={selectedDraftDetachment.id}
            onDeleteDetachment={deleteDraftDetachment}
            onUpdateDetachment={updateDraftDetachment}
          />
        </div>
      ) : (
        <p className="empty-state">No detachment selected.</p>
      )}

      <div className="detachment-editor-footer">
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSave(
              draftDetachments.map(cloneDetachmentPack),
              draftSelectedDetachmentId,
              deletedDetachmentIds,
            )
          }
        >
          Save
        </button>
      </div>
    </section>
  );
}

function getDraftSelectedDetachmentName(
  selectedDetachmentId: string,
  detachmentPacks: DetachmentPack[],
) {
  if (!selectedDetachmentId) {
    return "None selected";
  }

  return (
    detachmentPacks.find(
      (detachment) => detachment.id === selectedDetachmentId,
    )?.name ?? "None selected"
  );
}

type DetachmentEditorCardProps = {
  detachment: DetachmentPack;
  onDeleteDetachment: (detachmentId: string) => void;
  onUpdateDetachment: (detachment: DetachmentPack) => void;
};

function DetachmentEditorCard({
  detachment,
  onDeleteDetachment,
  onUpdateDetachment,
}: DetachmentEditorCardProps) {
  const isBuiltIn = BUILT_IN_DETACHMENTS.some(
    (builtInDetachment) => builtInDetachment.id === detachment.id,
  );

  return (
    <article className="detachment-card">
      <label>
        <span>Name</span>
        <input
          value={detachment.name}
          onChange={(event) =>
            onUpdateDetachment({ ...detachment, name: event.target.value })
          }
        />
      </label>
      <label>
        <span>Detachment Rule</span>
        <textarea
          value={detachment.detachmentRule}
          onChange={(event) =>
            onUpdateDetachment({
              ...detachment,
              detachmentRule: event.target.value,
            })
          }
        />
      </label>
      <label>
        <span>Enhancements</span>
        <textarea
          value={detachment.enhancements}
          onChange={(event) =>
            onUpdateDetachment({
              ...detachment,
              enhancements: event.target.value,
            })
          }
        />
      </label>

      <div className="stratagem-editor-heading">
        <h3>Stratagems</h3>
        <button
          type="button"
          onClick={() =>
            onUpdateDetachment({
              ...detachment,
              stratagems: [
                ...detachment.stratagems,
                {
                  id: createId(),
                  name: "New Stratagem",
                  cpCost: 1,
                  description: "",
                  phases: "Any",
                  timing: "both",
                },
              ],
            })
          }
        >
          Add Stratagem
        </button>
      </div>

      <div className="stratagem-editor-list">
        {detachment.stratagems.map((stratagem) => (
          <StratagemEditorCard
            key={stratagem.id}
            stratagem={stratagem}
            onDelete={() =>
              onUpdateDetachment({
                ...detachment,
                stratagems: detachment.stratagems.filter(
                  (currentStratagem) => currentStratagem.id !== stratagem.id,
                ),
              })
            }
            onUpdate={(nextStratagem) =>
              onUpdateDetachment({
                ...detachment,
                stratagems: detachment.stratagems.map((currentStratagem) =>
                  currentStratagem.id === nextStratagem.id
                    ? nextStratagem
                    : currentStratagem,
                ),
              })
            }
          />
        ))}
      </div>

      {!isBuiltIn && (
        <button
          className="danger-button"
          type="button"
          onClick={() => onDeleteDetachment(detachment.id)}
        >
          Delete Detachment
        </button>
      )}
    </article>
  );
}

type StratagemEditorCardProps = {
  stratagem: DetachmentStratagem;
  onDelete: () => void;
  onUpdate: (stratagem: DetachmentStratagem) => void;
};

function StratagemEditorCard({
  stratagem,
  onDelete,
  onUpdate,
}: StratagemEditorCardProps) {
  const selectedPhases = stratagem.phases === "Any" ? [] : stratagem.phases;

  return (
    <article className="stratagem-editor-card">
      <div className="stratagem-editor-grid">
        <label>
          <span>Name</span>
          <input
            value={stratagem.name}
            onChange={(event) =>
              onUpdate({ ...stratagem, name: event.target.value })
            }
          />
        </label>
        <label>
          <span>CP</span>
          <input
            min={0}
            type="number"
            value={stratagem.cpCost}
            onChange={(event) =>
              onUpdate({
                ...stratagem,
                cpCost: Number(event.target.value) || 0,
              })
            }
          />
        </label>
        <label>
          <span>Timing</span>
          <select
            value={stratagem.timing}
            onChange={(event) =>
              onUpdate({
                ...stratagem,
                timing: event.target.value as StratagemTiming,
              })
            }
          >
            <option value="both">Both turns</option>
            <option value="own-turn">Your turn</option>
            <option value="opponent-turn">Opponent turn</option>
          </select>
        </label>
      </div>

      <fieldset className="phase-picker">
        <legend>Phases</legend>
        <label>
          <input
            checked={stratagem.phases === "Any"}
            type="checkbox"
            onChange={(event) =>
              onUpdate({
                ...stratagem,
                phases: event.target.checked ? "Any" : [Phase.Command],
              })
            }
          />
          Any
        </label>
        {PHASES.map((phase) => (
          <label key={phase}>
            <input
              checked={stratagem.phases !== "Any" && selectedPhases.includes(phase)}
              disabled={stratagem.phases === "Any"}
              type="checkbox"
              onChange={(event) => {
                const nextPhases = event.target.checked
                  ? [...selectedPhases, phase]
                  : selectedPhases.filter((selectedPhase) => selectedPhase !== phase);

                onUpdate({
                  ...stratagem,
                  phases: nextPhases.length > 0 ? nextPhases : [Phase.Command],
                });
              }}
            />
            {phase.replace(" Phase", "")}
          </label>
        ))}
      </fieldset>

      <label>
        <span>Stratagem Text</span>
        <textarea
          value={stratagem.description}
          onChange={(event) =>
            onUpdate({ ...stratagem, description: event.target.value })
          }
        />
      </label>
      <button type="button" onClick={onDelete}>
        Delete Stratagem
      </button>
    </article>
  );
}

function DetachmentDetail({ detachment }: { detachment: DetachmentPack }) {
  return (
    <div className="detachment-detail">
      <section>
        <h3>Detachment Rule</h3>
        <p>{detachment.detachmentRule || "No detachment rule saved."}</p>
      </section>
      <section>
        <h3>Enhancements</h3>
        <p>{detachment.enhancements || "No enhancements saved."}</p>
      </section>
      <section>
        <h3>Stratagems</h3>
        {detachment.stratagems.length > 0 ? (
          <ul>
            {detachment.stratagems.map((stratagem) => (
              <li key={stratagem.id}>
                <strong>{stratagem.name}</strong>
                <span>{stratagem.cpCost} CP</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No stratagems saved.</p>
        )}
      </section>
    </div>
  );
}

type AddChipModalProps = {
  closeAriaLabel: string;
  descriptionLabel: string;
  itemType: string;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  subtitle: string;
  title: string;
};

function AddChipModal({
  closeAriaLabel,
  descriptionLabel,
  itemType,
  onClose,
  onSubmit,
  subtitle,
  title,
}: AddChipModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <Modal
      ariaLabelledBy="chip-add-modal-title"
      closeAriaLabel={closeAriaLabel}
      header={
        <Header
          title={title}
          titleId="chip-add-modal-title"
          subtitle={subtitle}
        />
      }
      maxWidth={520}
      onClose={onClose}
    >
      <form
        className="chip-edit-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit(name, description);
        }}
      >
        <label>
          <span>{itemType} name</span>
          <input
            autoFocus
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          <span>{descriptionLabel}</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="chip-edit-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button disabled={!name.trim()} type="submit">
            Add
          </button>
        </div>
      </form>
    </Modal>
  );
}

type RemoveChipModalProps = {
  closeAriaLabel: string;
  emptyText: string;
  itemNames: string[];
  onClose: () => void;
  onRemove: (name: string) => ChipUndo | undefined;
  subtitle: string;
  title: string;
};

function RemoveChipModal({
  closeAriaLabel,
  emptyText,
  itemNames,
  onClose,
  onRemove,
  subtitle,
  title,
}: RemoveChipModalProps) {
  const uniqueItemNames = [...new Set(itemNames)];
  const [lastRemoved, setLastRemoved] = useState<ChipUndo | null>(null);

  return (
    <Modal
      ariaLabelledBy="chip-remove-modal-title"
      closeAriaLabel={closeAriaLabel}
      header={
        <Header
          title={title}
          titleId="chip-remove-modal-title"
          subtitle={subtitle}
        />
      }
      maxWidth={520}
      onClose={onClose}
    >
      {uniqueItemNames.length > 0 ? (
        <div className="chip-remove-list">
          {uniqueItemNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                const undoAction = onRemove(name);

                if (undoAction) {
                  setLastRemoved(undoAction);
                }
              }}
            >
              {name}
            </button>
          ))}
        </div>
      ) : (
        <p className="chip-empty-state">{emptyText}</p>
      )}
      {lastRemoved && (
        <div className="chip-undo">
          <span>Removed {lastRemoved.label}</span>
          <button
            type="button"
            onClick={() => {
              lastRemoved.undo();
              setLastRemoved(null);
            }}
          >
            Undo
          </button>
        </div>
      )}
    </Modal>
  );
}

function SelectedArmyRuleDescription({ army }: { army: SavedArmy }) {
  const selectedChoice = getSelectedArmyRuleChoice(army);

  if (!selectedChoice) {
    return null;
  }

  return <p className="army-rule-description">{selectedChoice.description}</p>;
}

function getSelectedArmyRuleChoice(army: SavedArmy | null) {
  if (!army?.selectedArmyRuleChoiceId) {
    return null;
  }

  return (
    army.armyRules
      ?.flatMap((rule) => rule.choices)
      .find((choice) => choice.id === army.selectedArmyRuleChoiceId) ?? null
  );
}

function getSavedUnit(army: SavedArmy | null, unitId: string | null) {
  if (!army || !unitId) {
    return null;
  }

  return army.units.find((unit) => unit.id === unitId) ?? null;
}

function getWeaponName(unit: ArmyUnit, weaponKey: string) {
  return (
    getActiveWeapons(unit).find((weapon) => getWeaponKey(weapon) === weaponKey)
      ?.name ?? "Weapon"
  );
}

function getVisibleWeaponKeywordNames(unit: ArmyUnit, weaponKey: string) {
  const weapon = getActiveWeapons(unit).find(
    (currentWeapon) => getWeaponKey(currentWeapon) === weaponKey,
  );

  return weapon ? getWeaponKeywords(weapon).map((keyword) => keyword.name) : [];
}

function getDetachmentStratagems(detachment: DetachmentPack | null): Stratagem[] {
  if (!detachment) {
    return [];
  }

  return detachment.stratagems.map((stratagem) => ({
    id: `${detachment.id}:${stratagem.id}`,
    detachmentKey: detachment.id,
    name: stratagem.name,
    cpCost: stratagem.cpCost,
    description: stratagem.description,
    phases: stratagem.phases,
    source: "detachment",
    timing: stratagem.timing,
  }));
}

type ArmyManagerProps = {
  activeArmyId: string;
  armies: SavedArmy[];
  onDeleteArmy: (armyId: string) => void;
  onOpenArmy: (armyId: string) => void;
  onRenameArmy: (armyId: string, name: string) => void;
};

function ArmyManager({
  activeArmyId,
  armies,
  onDeleteArmy,
  onOpenArmy,
  onRenameArmy,
}: ArmyManagerProps) {
  if (armies.length === 0) {
    return <p className="empty-state">No saved armies yet.</p>;
  }

  return (
    <section className="army-manager" aria-label="Saved armies">
      {armies.map((army) => (
        <article className="army-manager-card" key={army.id}>
          <div className="army-manager-card__body">
            <label>
              <span>Army name</span>
              <input
                value={army.name}
                onChange={(event) => onRenameArmy(army.id, event.target.value)}
              />
            </label>
            <p>
              {army.units.length} units / imported{" "}
              {new Date(army.importedAt).toLocaleDateString()}
            </p>
            {army.id === activeArmyId && <strong>Current army</strong>}
          </div>

          <div className="army-manager-card__actions">
            <button type="button" onClick={() => onOpenArmy(army.id)}>
              Open
            </button>
            <button type="button" onClick={() => onDeleteArmy(army.id)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}

function loadSavedArmies(): SavedArmy[] {
  try {
    const savedArmies = localStorage.getItem(SAVED_ARMIES_STORAGE_KEY);
    const parsedArmies = savedArmies
      ? (JSON.parse(savedArmies) as SavedArmy[])
      : [];

    return normalizeSavedArmies(parsedArmies);
  } catch {
    return [];
  }
}

function normalizeSavedArmies(armies: SavedArmy[]): SavedArmy[] {
  return armies.map((army) => ({
      ...army,
      armyRules: army.armyRules ?? [],
      units: (army.units ?? []).map((unit) => ({
        ...unit,
        abilities: (unit.abilities ?? []).map((ability) => ({
          ...ability,
          displayName: ability.displayName || undefined,
        })).sort(compareSavedAbilities),
        weaponKeywordOverrides: (unit.weaponKeywordOverrides ?? []).map(
          (override) => ({
            weaponKey: override.weaponKey,
            added: override.added ?? [],
            removed: override.removed ?? [],
          }),
        ),
      })),
    }));
}

function getUnitOverridePayload(unit: ArmyUnit): UnitOverridePayload {
  return {
    abilities: unit.abilities ?? [],
    weaponKeywordOverrides: unit.weaponKeywordOverrides ?? [],
  };
}

function loadDetachmentPacks(): DetachmentPack[] {
  try {
    const savedDetachments = localStorage.getItem(DETACHMENTS_STORAGE_KEY);
    const parsedDetachments = savedDetachments
      ? (JSON.parse(savedDetachments) as DetachmentPack[])
      : [];

    return mergeBuiltInDetachments(parsedDetachments);
  } catch {
    return BUILT_IN_DETACHMENTS;
  }
}

function mergeBuiltInDetachments(savedDetachments: DetachmentPack[]) {
  const savedById = new Map(
    savedDetachments.map((detachment) => [detachment.id, detachment]),
  );
  const mergedBuiltIns = BUILT_IN_DETACHMENTS.map((detachment) =>
    normalizeDetachmentPack(savedById.get(detachment.id) ?? detachment),
  );
  const customDetachments = savedDetachments
    .filter(
      (detachment) =>
        !BUILT_IN_DETACHMENTS.some(
          (builtInDetachment) => builtInDetachment.id === detachment.id,
        ),
    )
    .map(normalizeDetachmentPack);

  return [...mergedBuiltIns, ...customDetachments];
}

function cloneDetachmentPack(detachment: DetachmentPack): DetachmentPack {
  return {
    ...detachment,
    stratagems: detachment.stratagems.map((stratagem) => ({ ...stratagem })),
  };
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

function normalizeDetachmentStratagem(
  stratagem: DetachmentStratagem,
): DetachmentStratagem {
  return {
    id: stratagem.id || createId(),
    name: stratagem.name || "Unnamed Stratagem",
    cpCost: Number.isFinite(stratagem.cpCost) ? stratagem.cpCost : 1,
    description: stratagem.description ?? "",
    phases: stratagem.phases === "Any" ? "Any" : stratagem.phases ?? "Any",
    timing: stratagem.timing ?? "both",
  };
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getModelCount(
  value: number | undefined,
  fallback: number = 0,
): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function compareSavedAbilities(
  first: ArmyUnit["abilities"][number],
  second: ArmyUnit["abilities"][number],
) {
  const firstIsLeader = isSavedLeaderAbility(first);
  const secondIsLeader = isSavedLeaderAbility(second);

  if (firstIsLeader !== secondIsLeader) {
    return firstIsLeader ? 1 : -1;
  }

  return first.name.localeCompare(second.name);
}

function isSavedLeaderAbility(ability: ArmyUnit["abilities"][number]) {
  return ability.name.trim().toLowerCase() === "leader";
}

function upsertWeaponKeywordOverride(
  overrides: NonNullable<ArmyUnit["weaponKeywordOverrides"]>,
  weaponKey: string,
  keywordName: string,
  description: string,
) {
  const existingOverride = overrides.find(
    (override) => override.weaponKey === weaponKey,
  );
  const nextKeyword = {
    id: createId(),
    name: keywordName,
    description,
  };

  if (!existingOverride) {
    return [
      ...overrides,
      {
        weaponKey,
        added: [nextKeyword],
        removed: [],
      },
    ];
  }

  return overrides.map((override) => {
    if (override.weaponKey !== weaponKey) {
      return override;
    }

    return {
      ...override,
      added: [
        ...override.added.filter(
          (keyword) => normalizeName(keyword.name) !== normalizeName(keywordName),
        ),
        nextKeyword,
      ],
      removed: override.removed.filter(
        (keyword) => normalizeName(keyword) !== normalizeName(keywordName),
      ),
    };
  });
}

function removeWeaponKeywordOverride(
  overrides: NonNullable<ArmyUnit["weaponKeywordOverrides"]>,
  weaponKey: string,
  keywordName: string,
) {
  const nextOverrides = overrides.map((override) => {
    if (override.weaponKey !== weaponKey) {
      return override;
    }

    return {
      ...override,
      added: override.added.filter(
        (keyword) => normalizeName(keyword.name) !== normalizeName(keywordName),
      ),
      removed: [
        ...override.removed.filter(
          (keyword) => normalizeName(keyword) !== normalizeName(keywordName),
        ),
        keywordName,
      ],
    };
  });

  if (!nextOverrides.some((override) => override.weaponKey === weaponKey)) {
    return [
      ...nextOverrides,
      {
        weaponKey,
        added: [],
        removed: [keywordName],
      },
    ];
  }

  return nextOverrides.filter(
    (override) => override.added.length > 0 || override.removed.length > 0,
  );
}

function restoreWeaponKeywordOverride(
  overrides: NonNullable<ArmyUnit["weaponKeywordOverrides"]>,
  weaponKey: string,
  keyword: { description: string; name: string },
) {
  const nextKeyword = {
    id: createId(),
    name: keyword.name,
    description: keyword.description,
  };
  const nextOverrides = overrides.map((override) => {
    if (override.weaponKey !== weaponKey) {
      return override;
    }

    return {
      ...override,
      added: [
        ...override.added.filter(
          (currentKeyword) =>
            normalizeName(currentKeyword.name) !== normalizeName(keyword.name),
        ),
        nextKeyword,
      ],
      removed: override.removed.filter(
        (currentKeyword) =>
          normalizeName(currentKeyword) !== normalizeName(keyword.name),
      ),
    };
  });

  if (!nextOverrides.some((override) => override.weaponKey === weaponKey)) {
    return [
      ...nextOverrides,
      {
        weaponKey,
        added: [nextKeyword],
        removed: [],
      },
    ];
  }

  return nextOverrides.filter(
    (override) => override.added.length > 0 || override.removed.length > 0,
  );
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
}

type ApiOptions = {
  body?: unknown;
  method?: string;
  token?: string;
};

async function apiRequest<T = unknown>(
  path: string,
  { body, method = "GET", token }: ApiOptions = {},
): Promise<T> {
  const response = await fetch(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    method,
  });

  const responseBody = response.status === 204 ? null : await response.json();

  if (!response.ok) {
    throw new Error(responseBody?.error ?? "Request failed");
  }

  return responseBody as T;
}

function isLocalApp() {
  return (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

async function getNeonSessionAccount(): Promise<AuthAccount | null> {
  if (!neonAuthClient) {
    return null;
  }

  const result = await neonAuthClient.getSession();
  const session = result.data?.session;
  const user = result.data?.user;

  if (!session || !user) {
    return null;
  }

  return {
    id: user.id,
    isAdmin: false,
    provider: "neon",
    username: user.email || user.name || "Neon user",
  };
}

export default App;
