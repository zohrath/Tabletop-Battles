import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import "./App.css";
import { getNeonAuthToken, neonAuthClient, neonAuthEnabled } from "./lib/auth";
import { Header } from "./components/header/Header";
import { Modal } from "./components/modal/Modal";
import { PhaseIndicator } from "./components/phaseIndicator/PhaseIndicator";
import { Toolbar } from "./components/toolbar/Toolbar";
import { AdminDatabasePage } from "./pages/AdminDatabasePage";
import { ArmiesPage } from "./pages/ArmiesPage";
import { ArmyRulePage } from "./pages/ArmyRulePage";
import { BattlePage } from "./pages/BattlePage";
import type { DetachmentPack, DetachmentStratagem, SavedArmy } from "./types/AppData";
import type { AppPage } from "./types/AppPage";
import { TURN_OWNERS, TURNS, type BattlePhase, type TurnOwner, type Turn } from "./types/BattlePhase";
import { Phase } from "./types/Phase";
import type { Stratagem, StratagemTiming } from "./types/Stratagem";
import type { ArmyImported } from "./types/armyImported";
import { apiRequest } from "./utils/api";
import { extractArmyRules, extractArmyUnits, type ArmyUnit } from "./utils/armyImported";
import { getSelectedArmyRuleChoice } from "./utils/armyRules";
import { bastionTaskForceStratagems, coreStratagems, getStratagemsForBattlePhase } from "./utils/stratagems";
import { getActiveWeapons, getWeaponKey, getWeaponKeywords } from "./utils/weapon";
import LoginPage from "./pages/LoginPage";

const SAVED_ARMIES_STORAGE_KEY = "tabletop-battles.saved-armies";
const DETACHMENTS_STORAGE_KEY = "tabletop-battles.detachments";
const AUTH_TOKEN_STORAGE_KEY = "tabletop-battles.auth-token";
const AUTH_PROVIDER_STORAGE_KEY = "tabletop-battles.auth-provider";
const PHASES = Object.values(Phase) as Phase[];

const INITIAL_BATTLE_PHASE: BattlePhase = {
  phase: PHASES[0],
  owner: TURN_OWNERS[0],
  turn: TURNS[0],
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

type ArmyListsResponse = {
  armies: SavedArmy[];
};

type DetachmentsResponse = {
  detachments: DetachmentPack[];
};

type UserPreferencesResponse = {
  preferences: {
    selectedArmyListId: string | null;
  };
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
  const location = useLocation();
  const navigate = useNavigate();
  const [authToken, setAuthToken] = useState(() => localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) ?? "");
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(() =>
    localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || neonAuthEnabled ? "checking" : "logged-out",
  );
  const [authProvider, setAuthProvider] = useState<AuthProvider>(() =>
    localStorage.getItem(AUTH_PROVIDER_STORAGE_KEY) === "neon" ? "neon" : "local",
  );
  const [authAccount, setAuthAccount] = useState<AuthAccount | null>(null);
  const [savedArmies, setSavedArmies] = useState<SavedArmy[]>(loadSavedArmies);
  const [detachmentPacks, setDetachmentPacks] = useState<DetachmentPack[]>(loadDetachmentPacks);
  const [activeArmyId, setActiveArmyId] = useState(() => savedArmies[0]?.id ?? "");
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [firstTurnOwner, setFirstTurnOwner] = useState<TurnOwner | null>(null);
  const [firstTurnModalOpen, setFirstTurnModalOpen] = useState(false);
  const [detachmentEditorOpen, setDetachmentEditorOpen] = useState(false);
  const [selectedDetachmentDetail, setSelectedDetachmentDetail] = useState<DetachmentPack | null>(null);
  const [addAbilityUnitId, setAddAbilityUnitId] = useState<string | null>(null);
  const [removeAbilityUnitId, setRemoveAbilityUnitId] = useState<string | null>(null);
  const [addWeaponKeywordTarget, setAddWeaponKeywordTarget] = useState<WeaponKeywordTarget | null>(null);
  const [removeWeaponKeywordTarget, setRemoveWeaponKeywordTarget] = useState<WeaponKeywordTarget | null>(null);
  const [stratagemsIndicatorOpen, setStratagemsIndicatorOpen] = useState(false);
  const [battlePhase, setBattlePhase] = useState<BattlePhase>(INITIAL_BATTLE_PHASE);

  const activeArmy = savedArmies.find((army) => army.id === activeArmyId) ?? null;
  const selectedDetachment =
    detachmentPacks.find((detachment) => detachment.id === activeArmy?.selectedDetachmentId) ?? null;
  const detachmentStratagems = getDetachmentStratagems(selectedDetachment);
  const turnOwners = getTurnOwners(firstTurnOwner);
  const visibleCoreStratagems = getStratagemsForBattlePhase(coreStratagems, battlePhase);
  const visibleDetachmentStratagems = getStratagemsForBattlePhase(detachmentStratagems, battlePhase);
  const hasVisibleStratagems = visibleCoreStratagems.length > 0 || visibleDetachmentStratagems.length > 0;
  const addAbilityUnit = getSavedUnit(activeArmy, addAbilityUnitId);
  const removeAbilityUnit = getSavedUnit(activeArmy, removeAbilityUnitId);
  const addWeaponKeywordUnit = getSavedUnit(activeArmy, addWeaponKeywordTarget?.unitId ?? null);
  const removeWeaponKeywordUnit = getSavedUnit(activeArmy, removeWeaponKeywordTarget?.unitId ?? null);
  const addWeaponKeywordName =
    addWeaponKeywordUnit && addWeaponKeywordTarget
      ? getWeaponName(addWeaponKeywordUnit, addWeaponKeywordTarget.weaponKey)
      : "";
  const removeWeaponKeywordNames =
    removeWeaponKeywordUnit && removeWeaponKeywordTarget
      ? getVisibleWeaponKeywordNames(removeWeaponKeywordUnit, removeWeaponKeywordTarget.weaponKey)
      : [];
  const currentPage = getAppPageFromPath(location.pathname, Boolean(authAccount?.isAdmin));

  const getApiAuthToken = useCallback(async () => {
    if (authProvider === "neon") {
      const token = await getNeonAuthToken();

      console.info("[auth] API token resolved", {
        provider: authProvider,
        tokenPresent: Boolean(token),
      });

      return token;
    }

    console.info("[auth] API token resolved", {
      provider: authProvider,
      tokenPresent: Boolean(authToken),
    });

    return authToken;
  }, [authProvider, authToken]);

  const saveUserPreferencesToDatabase = useCallback(
    async (selectedArmyListId: string) => {
      if (sessionStatus !== "logged-in") {
        return;
      }

      const token = await getApiAuthToken();

      if (!token) {
        return;
      }

      await apiRequest("/api/preferences", {
        body: { selectedArmyListId: selectedArmyListId || null },
        method: "PUT",
        token,
      }).catch(() => undefined);
    },
    [getApiAuthToken, sessionStatus],
  );

  useEffect(() => {
    if (sessionStatus !== "logged-in") {
      return;
    }

    let cancelled = false;

    async function loadDatabaseArmies() {
      try {
        const token = await getApiAuthToken();

        if (!token) {
          console.info("[auth] Skipping army sync: no API token");
          return;
        }

        console.info("[auth] Loading database armies");

        const [{ armies }, { preferences }] = await Promise.all([
          apiRequest<ArmyListsResponse>("/api/army-lists", {
            token,
          }),
          apiRequest<UserPreferencesResponse>("/api/preferences", {
            token,
          }),
        ]);
        const normalizedArmies = normalizeSavedArmies(armies);

        if (cancelled) {
          return;
        }

        if (normalizedArmies.length > 0) {
          setSavedArmies(normalizedArmies);
          setActiveArmyId((currentArmyId) =>
            getPreferredArmyId(normalizedArmies, preferences.selectedArmyListId, currentArmyId),
          );
          localStorage.removeItem(SAVED_ARMIES_STORAGE_KEY);
          return;
        }

        const localArmies = loadSavedArmies();

        if (localArmies.length === 0) {
          return;
        }

        const imported = await apiRequest<ArmyListsResponse>("/api/army-lists", {
          body: { armies: localArmies },
          method: "POST",
          token,
        });
        const importedArmies = normalizeSavedArmies(imported.armies);

        if (!cancelled) {
          setSavedArmies(importedArmies);
          setActiveArmyId((currentArmyId) => {
            const selectedArmyId = getPreferredArmyId(importedArmies, preferences.selectedArmyListId, currentArmyId);

            void saveUserPreferencesToDatabase(selectedArmyId);
            return selectedArmyId;
          });
          localStorage.removeItem(SAVED_ARMIES_STORAGE_KEY);
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
  }, [getApiAuthToken, saveUserPreferencesToDatabase, sessionStatus]);

  useEffect(() => {
    if (sessionStatus !== "logged-in") {
      return;
    }

    let cancelled = false;

    async function loadDatabaseDetachments() {
      try {
        const token = await getApiAuthToken();

        if (!token) {
          console.info("[auth] Skipping detachment sync: no API token");
          return;
        }

        console.info("[auth] Loading database detachments");

        const { detachments } = await apiRequest<DetachmentsResponse>("/api/detachments", {
          token,
        });
        const normalizedDetachments = mergeBuiltInDetachments(detachments);

        if (cancelled) {
          return;
        }

        if (detachments.length > 0) {
          setDetachmentPacks(normalizedDetachments);
          localStorage.removeItem(DETACHMENTS_STORAGE_KEY);
          return;
        }

        const localDetachments = loadDetachmentPacks();

        if (localDetachments.length === 0) {
          return;
        }

        const imported = await apiRequest<DetachmentsResponse>("/api/detachments", {
          body: { detachments: localDetachments },
          method: "POST",
          token,
        });
        const importedDetachments = mergeBuiltInDetachments(imported.detachments);

        if (!cancelled) {
          setDetachmentPacks(importedDetachments);
          localStorage.removeItem(DETACHMENTS_STORAGE_KEY);
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
  }, [getApiAuthToken, sessionStatus]);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      console.info("[auth] Checking session", {
        hasStoredToken: Boolean(authToken),
        neonAuthEnabled,
      });

      if (authToken) {
        try {
          const { account } = await apiRequest<{ account: AuthAccount | LocalAuthAccount }>("/api/session", {
            token: authToken,
          });

          if (!cancelled) {
            const provider = "provider" in account ? account.provider : "local";
            console.info("[auth] Existing API session accepted", {
              provider,
            });
            setAuthProvider(provider);
            setAuthAccount({ ...account, provider });
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
          const token = await getNeonAuthToken();

          if (!cancelled) {
            console.info("[auth] Existing Neon session accepted", {
              tokenPresent: Boolean(token),
            });
            localStorage.setItem(AUTH_PROVIDER_STORAGE_KEY, "neon");
            setAuthToken(token);
            setAuthProvider("neon");
            setAuthAccount(account);
            setSessionStatus("logged-in");
          }
          return;
        }
      }

      if (!cancelled) {
        console.info("[auth] No existing session");
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
    console.info("[auth] Local login start");
    const result = await apiRequest<{ account: AuthAccount; token: string }>("/api/login", {
      body: { username, password },
      method: "POST",
    });

    console.info("[auth] Local login success", {
      provider: result.account.provider ?? "local",
      tokenPresent: Boolean(result.token),
    });

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

    console.info("[auth] Neon login start");
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
    const token = await getNeonAuthToken();
    console.info("[auth] Neon login success", {
      tokenPresent: Boolean(token),
    });
    setAuthToken(token);
    setAuthProvider("neon");
    setAuthAccount(account);
    setSessionStatus("logged-in");
  }

  async function signUpWithNeon(email: string, password: string) {
    if (!neonAuthClient) {
      throw new Error("Neon Auth is not configured.");
    }

    console.info("[auth] Neon sign-up start");
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
    const token = await getNeonAuthToken();
    console.info("[auth] Neon sign-up success", {
      tokenPresent: Boolean(token),
    });
    setAuthToken(token);
    setAuthProvider("neon");
    setAuthAccount(account);
    setSessionStatus("logged-in");
  }

  async function logout() {
    if (authProvider === "neon" && neonAuthClient) {
      await neonAuthClient.signOut().catch(() => undefined);
    }

    if (authProvider === "local" && authToken) {
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
      void saveUserPreferencesToDatabase(savedArmy.id);
      navigate(getAppPagePath("battle"));
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
                const startingCount = getModelCount(model.startingNumber, currentCount);

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
    updateSavedArmies((currentArmies) => currentArmies.map((army) => (army.id === armyId ? { ...army, name } : army)));
  }

  function deleteArmy(armyId: string) {
    const nextActiveArmyId =
      armyId === activeArmyId ? (savedArmies.find((army) => army.id !== armyId)?.id ?? "") : activeArmyId;

    void deleteSavedArmyFromDatabase(armyId);
    updateSavedArmies((currentArmies) => currentArmies.filter((army) => army.id !== armyId));

    if (armyId === activeArmyId) {
      setActiveArmyId(nextActiveArmyId);
      void saveUserPreferencesToDatabase(nextActiveArmyId);
    }
  }

  function openArmy(armyId: string) {
    setActiveArmyId(armyId);
    void saveUserPreferencesToDatabase(armyId);
    navigate(getAppPagePath("battle"));
  }

  function chooseArmyRule(choiceId: string) {
    if (!activeArmy) {
      return;
    }

    updateSavedArmies((currentArmies) =>
      currentArmies.map((army) => (army.id === activeArmy.id ? { ...army, selectedArmyRuleChoiceId: choiceId } : army)),
    );
  }

  function updateDetachmentPacks(getNextDetachments: (currentDetachments: DetachmentPack[]) => DetachmentPack[]) {
    setDetachmentPacks((currentDetachments) => {
      const nextDetachments = getNextDetachments(currentDetachments);
      if (!hasDatabaseSession(sessionStatus, authToken, authProvider)) {
        localStorage.setItem(DETACHMENTS_STORAGE_KEY, JSON.stringify(nextDetachments));
      }
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
    if (sessionStatus !== "logged-in") {
      return;
    }

    const token = await getApiAuthToken();

    if (!token) {
      return;
    }

    await apiRequest("/api/detachments", {
      body: { detachments: nextDetachments },
      method: "POST",
      token,
    }).catch(() => undefined);
  }

  async function deleteDetachmentFromDatabase(detachmentId: string) {
    if (sessionStatus !== "logged-in") {
      return;
    }

    const token = await getApiAuthToken();

    if (!token) {
      return;
    }

    await apiRequest(`/api/detachments/${detachmentId}`, {
      method: "DELETE",
      token,
    }).catch(() => undefined);
  }

  function updateActiveArmyUnitOverride(unitId: string, getNextUnit: (unit: ArmyUnit) => ArmyUnit) {
    if (!activeArmy) {
      return null;
    }

    const currentUnit = activeArmy.units.find((unit) => unit.id === unitId) ?? null;

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
                units: army.units.map((unit) => (unit.id === unitId ? nextUnit : unit)),
              }
            : army,
        ),
      { syncDatabase: false },
    );
    void saveUnitOverrideToDatabase(activeArmy.id, nextUnit);

    return nextUnit;
  }

  function changeAbilityDisplayName(unitId: string, abilityId: string, displayName: string) {
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
      (ability) => normalizeName(ability.displayName || ability.name) === normalizeName(name),
    );

    if (!removedAbility) {
      return undefined;
    }

    updateActiveArmyUnitOverride(unitId, (currentUnit) => ({
      ...currentUnit,
      abilities: (currentUnit.abilities ?? []).filter(
        (ability) => normalizeName(ability.displayName || ability.name) !== normalizeName(name),
      ),
    }));

    return {
      label: removedAbility.displayName || removedAbility.name,
      undo: () => restoreUnitAbility(unitId, removedAbility),
    };
  }

  function restoreUnitAbility(unitId: string, ability: ArmyUnit["abilities"][number]) {
    updateActiveArmyUnitOverride(unitId, (unit) => {
      const abilities = unit.abilities ?? [];

      if (abilities.some((currentAbility) => currentAbility.id === ability.id)) {
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

  function saveWeaponKeyword(unitId: string, weaponKey: string, name: string, description: string) {
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

  function deleteWeaponKeyword(unitId: string, weaponKey: string, name: string): ChipUndo | undefined {
    if (!name.trim() || !activeArmy) {
      return undefined;
    }

    const unit = activeArmy.units.find((currentUnit) => currentUnit.id === unitId);
    const weapon = unit
      ? getActiveWeapons(unit).find((currentWeapon) => getWeaponKey(currentWeapon) === weaponKey)
      : null;
    const removedKeyword = weapon
      ? getWeaponKeywords(weapon).find((keyword) => normalizeName(keyword.name) === normalizeName(name))
      : null;

    if (!removedKeyword) {
      return undefined;
    }

    updateActiveArmyUnitOverride(unitId, (unit) => ({
      ...unit,
      weaponKeywordOverrides: removeWeaponKeywordOverride(unit.weaponKeywordOverrides ?? [], weaponKey, name.trim()),
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

  function restoreWeaponKeyword(unitId: string, weaponKey: string, keyword: { description: string; name: string }) {
    updateActiveArmyUnitOverride(unitId, (unit) => ({
      ...unit,
      weaponKeywordOverrides: restoreWeaponKeywordOverride(unit.weaponKeywordOverrides ?? [], weaponKey, keyword),
    }));
  }

  function updateSavedArmies(
    getNextArmies: (currentArmies: SavedArmy[]) => SavedArmy[],
    options: { syncDatabase?: boolean } = {},
  ) {
    setSavedArmies((currentArmies) => {
      const nextArmies = getNextArmies(currentArmies);
      if (!hasDatabaseSession(sessionStatus, authToken, authProvider)) {
        localStorage.setItem(SAVED_ARMIES_STORAGE_KEY, JSON.stringify(nextArmies));
      }
      if (options.syncDatabase ?? true) {
        void syncSavedArmiesToDatabase(nextArmies);
      }
      return nextArmies;
    });
  }

  async function syncSavedArmiesToDatabase(nextArmies: SavedArmy[]) {
    if (sessionStatus !== "logged-in") {
      return;
    }

    const token = await getApiAuthToken();

    if (!token) {
      return;
    }

    await apiRequest("/api/army-lists", {
      body: { armies: nextArmies },
      method: "POST",
      token,
    }).catch(() => undefined);
  }

  async function deleteSavedArmyFromDatabase(armyId: string) {
    if (sessionStatus !== "logged-in") {
      return;
    }

    const token = await getApiAuthToken();

    if (!token) {
      return;
    }

    await apiRequest(`/api/army-lists/${armyId}`, {
      method: "DELETE",
      token,
    }).catch(() => undefined);
  }

  async function saveUnitOverrideToDatabase(armyId: string, unit: ArmyUnit) {
    if (sessionStatus !== "logged-in") {
      return;
    }

    const token = await getApiAuthToken();

    if (!token) {
      return;
    }

    await apiRequest(`/api/army-lists/${encodeURIComponent(armyId)}/units/${encodeURIComponent(unit.id)}/override`, {
      body: { override: getUnitOverridePayload(unit) },
      method: "PUT",
      token,
    }).catch(() => undefined);
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
      <LoginPage
        neonAuthEnabled={neonAuthEnabled}
        onLocalLogin={login}
        onNeonLogin={loginWithNeon}
        onNeonSignUp={signUpWithNeon}
      />
    );
  }

  return (
    <main className="app-shell">
      <Toolbar
        activeArmyName={activeArmy?.name}
        activeArmySourceFileName={activeArmy?.sourceFileName}
        armyCount={savedArmies.length}
        hasActiveArmy={Boolean(activeArmy)}
        isAdmin={Boolean(authAccount?.isAdmin)}
        menuOpen={menuOpen}
        page={currentPage}
        selectedArmyRuleChoiceName={getSelectedArmyRuleChoice(activeArmy)?.name}
        setMenuOpen={setMenuOpen}
        username={authAccount?.username}
        onImportRoster={(file) => void handleRosterFile(file)}
        onLogout={() => void logout()}
        onNavigate={(nextPage) => navigate(getAppPagePath(nextPage))}
        onOpenDetachmentEditor={() => setDetachmentEditorOpen(true)}
        onOpenFirstTurnModal={() => setFirstTurnModalOpen(true)}
      />

      {error && <p className="error-message">{error}</p>}

      <Routes>
        <Route path="/" element={<Navigate replace to="/battle" />} />
        <Route
          path="/armies"
          element={
            <ArmiesPage
              activeArmyId={activeArmyId}
              armies={savedArmies}
              onDeleteArmy={deleteArmy}
              onOpenArmy={openArmy}
              onRenameArmy={renameArmy}
            />
          }
        />
        <Route path="/army-rule" element={<ArmyRulePage army={activeArmy} onChooseArmyRule={chooseArmyRule} />} />
        <Route
          path="/admin"
          element={
            authAccount?.isAdmin ? <AdminDatabasePage authToken={authToken} /> : <Navigate replace to="/battle" />
          }
        />
        <Route
          path="/battle"
          element={
            <BattlePage
              activeArmy={activeArmy}
              firstTurnOwner={firstTurnOwner}
              hasVisibleStratagems={hasVisibleStratagems}
              selectedDetachment={selectedDetachment}
              stratagemsIndicatorOpen={stratagemsIndicatorOpen}
              visibleCoreStratagems={visibleCoreStratagems}
              visibleDetachmentStratagems={visibleDetachmentStratagems}
              onAbilityDisplayNameChange={changeAbilityDisplayName}
              onAddAbility={addUnitAbility}
              onAddWeaponKeyword={addWeaponKeyword}
              onModelCountChange={changeModelCount}
              onOpenDetachmentDetail={setSelectedDetachmentDetail}
              onRemoveAbility={removeUnitAbility}
              onRemoveWeaponKeyword={removeWeaponKeyword}
              onToggleStratagemsIndicator={() => setStratagemsIndicatorOpen((isOpen) => !isOpen)}
            />
          }
        />
        <Route path="*" element={<Navigate replace to="/battle" />} />
      </Routes>
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
                      owner: current.owner === TURN_OWNERS[0] ? owner : getOtherTurnOwner(owner),
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
            <Header title={selectedDetachmentDetail.name} titleId="detachment-detail-title" subtitle="Detachment" />
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
          onSubmit={(name, description) => saveUnitAbility(addAbilityUnit.id, name, description)}
          subtitle={addAbilityUnit.name}
          title="Add Ability"
        />
      )}
      {removeAbilityUnit && (
        <RemoveChipModal
          closeAriaLabel="Close ability remover"
          emptyText="No abilities to remove."
          itemNames={(removeAbilityUnit.abilities ?? []).map((ability) => ability.displayName || ability.name)}
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
            saveWeaponKeyword(addWeaponKeywordTarget.unitId, addWeaponKeywordTarget.weaponKey, name, description)
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
            deleteWeaponKeyword(removeWeaponKeywordTarget.unitId, removeWeaponKeywordTarget.weaponKey, name)
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
            isLastBattlePhase(current, turnOwners) ? current : getNextBattlePhase(current, turnOwners),
          )
        }
        onPreviousPhase={() =>
          setBattlePhase((current) =>
            isFirstBattlePhase(current, turnOwners) ? current : getPreviousBattlePhase(current, turnOwners),
          )
        }
        onReset={() => setBattlePhase(getInitialBattlePhase(turnOwners))}
      />
    </main>
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

function isFirstBattlePhase(current: BattlePhase, turnOwners: readonly TurnOwner[]) {
  return current.turn === TURNS[0] && current.owner === turnOwners[0] && current.phase === PHASES[0];
}

function isLastBattlePhase(current: BattlePhase, turnOwners: readonly TurnOwner[]) {
  return (
    current.turn === TURNS[TURNS.length - 1] &&
    current.owner === turnOwners[turnOwners.length - 1] &&
    current.phase === PHASES[PHASES.length - 1]
  );
}

function getPreviousBattlePhase(current: BattlePhase, turnOwners: readonly TurnOwner[]): BattlePhase {
  if (current.phase !== PHASES[0]) {
    return {
      ...current,
      phase: getPreviousPhase(current.phase),
    };
  }

  const isFirstOwner = current.owner === turnOwners[0];

  return {
    phase: PHASES[PHASES.length - 1],
    owner: isFirstOwner ? turnOwners[turnOwners.length - 1] : getPreviousTurnOwner(current.owner, turnOwners),
    turn: isFirstOwner ? getPreviousTurn(current.turn) : current.turn,
  };
}

function getNextBattlePhase(current: BattlePhase, turnOwners: readonly TurnOwner[]): BattlePhase {
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

function getPreviousTurnOwner(currentOwner: TurnOwner, turnOwners: readonly TurnOwner[]) {
  const currentIndex = turnOwners.indexOf(currentOwner);
  const previousIndex = currentIndex <= 0 ? turnOwners.length - 1 : currentIndex - 1;

  return turnOwners[previousIndex];
}

function getNextTurnOwner(currentOwner: TurnOwner, turnOwners: readonly TurnOwner[]) {
  const currentIndex = turnOwners.indexOf(currentOwner);
  const nextIndex = currentIndex >= turnOwners.length - 1 ? 0 : currentIndex + 1;

  return turnOwners[nextIndex];
}

function getPreviousPhase(currentPhase: Phase) {
  const currentIndex = PHASES.indexOf(currentPhase);
  const previousIndex = currentIndex <= 0 ? PHASES.length - 1 : currentIndex - 1;

  return PHASES[previousIndex];
}

function getNextPhase(currentPhase: Phase) {
  const currentIndex = PHASES.indexOf(currentPhase);
  const nextIndex = currentIndex >= PHASES.length - 1 ? 0 : currentIndex + 1;

  return PHASES[nextIndex];
}

type DetachmentEditorProps = {
  activeArmy: SavedArmy | null;
  detachmentPacks: DetachmentPack[];
  onCancel: () => void;
  onSave: (detachmentPacks: DetachmentPack[], selectedDetachmentId: string, deletedDetachmentIds: string[]) => void;
};

function DetachmentEditor({ activeArmy, detachmentPacks, onCancel, onSave }: DetachmentEditorProps) {
  const [detachmentSelectorOpen, setDetachmentSelectorOpen] = useState(false);
  const [draftDetachments, setDraftDetachments] = useState(() => detachmentPacks.map(cloneDetachmentPack));
  const [draftSelectedDetachmentId, setDraftSelectedDetachmentId] = useState(
    () => activeArmy?.selectedDetachmentId ?? "",
  );
  const [deletedDetachmentIds, setDeletedDetachmentIds] = useState<string[]>([]);
  const selectedDraftDetachment =
    draftDetachments.find((detachment) => detachment.id === draftSelectedDetachmentId) ?? null;

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
      currentDetachments.map((detachment) => (detachment.id === nextDetachment.id ? nextDetachment : detachment)),
    );
  }

  function deleteDraftDetachment(detachmentId: string) {
    setDraftDetachments((currentDetachments) =>
      currentDetachments.filter((detachment) => detachment.id !== detachmentId),
    );
    setDeletedDetachmentIds((currentIds) =>
      currentIds.includes(detachmentId) ? currentIds : [...currentIds, detachmentId],
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
          {getDraftSelectedDetachmentName(draftSelectedDetachmentId, draftDetachments)}
        </button>
        {detachmentSelectorOpen && (
          <div aria-label="Current army detachment options" className="detachment-option-list" role="listbox">
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
            onSave(draftDetachments.map(cloneDetachmentPack), draftSelectedDetachmentId, deletedDetachmentIds)
          }
        >
          Save
        </button>
      </div>
    </section>
  );
}

function getDraftSelectedDetachmentName(selectedDetachmentId: string, detachmentPacks: DetachmentPack[]) {
  if (!selectedDetachmentId) {
    return "None selected";
  }

  return detachmentPacks.find((detachment) => detachment.id === selectedDetachmentId)?.name ?? "None selected";
}

type DetachmentEditorCardProps = {
  detachment: DetachmentPack;
  onDeleteDetachment: (detachmentId: string) => void;
  onUpdateDetachment: (detachment: DetachmentPack) => void;
};

function DetachmentEditorCard({ detachment, onDeleteDetachment, onUpdateDetachment }: DetachmentEditorCardProps) {
  const isBuiltIn = BUILT_IN_DETACHMENTS.some((builtInDetachment) => builtInDetachment.id === detachment.id);

  return (
    <article className="detachment-card">
      <label>
        <span>Name</span>
        <input
          value={detachment.name}
          onChange={(event) => onUpdateDetachment({ ...detachment, name: event.target.value })}
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
                stratagems: detachment.stratagems.filter((currentStratagem) => currentStratagem.id !== stratagem.id),
              })
            }
            onUpdate={(nextStratagem) =>
              onUpdateDetachment({
                ...detachment,
                stratagems: detachment.stratagems.map((currentStratagem) =>
                  currentStratagem.id === nextStratagem.id ? nextStratagem : currentStratagem,
                ),
              })
            }
          />
        ))}
      </div>

      {!isBuiltIn && (
        <button className="danger-button" type="button" onClick={() => onDeleteDetachment(detachment.id)}>
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

function StratagemEditorCard({ stratagem, onDelete, onUpdate }: StratagemEditorCardProps) {
  const selectedPhases = stratagem.phases === "Any" ? [] : stratagem.phases;

  return (
    <article className="stratagem-editor-card">
      <div className="stratagem-editor-grid">
        <label>
          <span>Name</span>
          <input value={stratagem.name} onChange={(event) => onUpdate({ ...stratagem, name: event.target.value })} />
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
          onChange={(event) => onUpdate({ ...stratagem, description: event.target.value })}
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
      header={<Header title={title} titleId="chip-add-modal-title" subtitle={subtitle} />}
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
          <input autoFocus value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          <span>{descriptionLabel}</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
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
      header={<Header title={title} titleId="chip-remove-modal-title" subtitle={subtitle} />}
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

function getAppPagePath(page: AppPage) {
  return page === "armyRule" ? "/army-rule" : `/${page}`;
}

function getAppPageFromPath(pathname: string, isAdmin: boolean): AppPage {
  if (pathname === "/armies") {
    return "armies";
  }

  if (pathname === "/army-rule") {
    return "armyRule";
  }

  if (pathname === "/admin" && isAdmin) {
    return "admin";
  }

  return "battle";
}

function getSavedUnit(army: SavedArmy | null, unitId: string | null) {
  if (!army || !unitId) {
    return null;
  }

  return army.units.find((unit) => unit.id === unitId) ?? null;
}

function getWeaponName(unit: ArmyUnit, weaponKey: string) {
  return getActiveWeapons(unit).find((weapon) => getWeaponKey(weapon) === weaponKey)?.name ?? "Weapon";
}

function getVisibleWeaponKeywordNames(unit: ArmyUnit, weaponKey: string) {
  const weapon = getActiveWeapons(unit).find((currentWeapon) => getWeaponKey(currentWeapon) === weaponKey);

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

function loadSavedArmies(): SavedArmy[] {
  try {
    const savedArmies = localStorage.getItem(SAVED_ARMIES_STORAGE_KEY);
    const parsedArmies = savedArmies ? (JSON.parse(savedArmies) as SavedArmy[]) : [];

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
      abilities: (unit.abilities ?? [])
        .map((ability) => ({
          ...ability,
          displayName: ability.displayName || undefined,
        }))
        .sort(compareSavedAbilities),
      weaponKeywordOverrides: (unit.weaponKeywordOverrides ?? []).map((override) => ({
        weaponKey: override.weaponKey,
        added: override.added ?? [],
        removed: override.removed ?? [],
      })),
    })),
  }));
}

function getPreferredArmyId(armies: SavedArmy[], preferredArmyId: string | null, currentArmyId: string) {
  if (preferredArmyId && armies.some((army) => army.id === preferredArmyId)) {
    return preferredArmyId;
  }

  if (currentArmyId && armies.some((army) => army.id === currentArmyId)) {
    return currentArmyId;
  }

  return armies[0]?.id ?? "";
}

function hasDatabaseSession(sessionStatus: SessionStatus, authToken: string, authProvider: AuthProvider) {
  return sessionStatus === "logged-in" && (authProvider === "neon" || Boolean(authToken));
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
    const parsedDetachments = savedDetachments ? (JSON.parse(savedDetachments) as DetachmentPack[]) : [];

    return mergeBuiltInDetachments(parsedDetachments);
  } catch {
    return BUILT_IN_DETACHMENTS;
  }
}

function mergeBuiltInDetachments(savedDetachments: DetachmentPack[]) {
  const savedById = new Map(savedDetachments.map((detachment) => [detachment.id, detachment]));
  const mergedBuiltIns = BUILT_IN_DETACHMENTS.map((detachment) =>
    normalizeDetachmentPack(savedById.get(detachment.id) ?? detachment),
  );
  const customDetachments = savedDetachments
    .filter((detachment) => !BUILT_IN_DETACHMENTS.some((builtInDetachment) => builtInDetachment.id === detachment.id))
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

function normalizeDetachmentStratagem(stratagem: DetachmentStratagem): DetachmentStratagem {
  return {
    id: stratagem.id || createId(),
    name: stratagem.name || "Unnamed Stratagem",
    cpCost: Number.isFinite(stratagem.cpCost) ? stratagem.cpCost : 1,
    description: stratagem.description ?? "",
    phases: stratagem.phases === "Any" ? "Any" : (stratagem.phases ?? "Any"),
    timing: stratagem.timing ?? "both",
  };
}

function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getModelCount(value: number | undefined, fallback: number = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function compareSavedAbilities(first: ArmyUnit["abilities"][number], second: ArmyUnit["abilities"][number]) {
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
  const existingOverride = overrides.find((override) => override.weaponKey === weaponKey);
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
        ...override.added.filter((keyword) => normalizeName(keyword.name) !== normalizeName(keywordName)),
        nextKeyword,
      ],
      removed: override.removed.filter((keyword) => normalizeName(keyword) !== normalizeName(keywordName)),
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
      added: override.added.filter((keyword) => normalizeName(keyword.name) !== normalizeName(keywordName)),
      removed: [
        ...override.removed.filter((keyword) => normalizeName(keyword) !== normalizeName(keywordName)),
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

  return nextOverrides.filter((override) => override.added.length > 0 || override.removed.length > 0);
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
          (currentKeyword) => normalizeName(currentKeyword.name) !== normalizeName(keyword.name),
        ),
        nextKeyword,
      ],
      removed: override.removed.filter(
        (currentKeyword) => normalizeName(currentKeyword) !== normalizeName(keyword.name),
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

  return nextOverrides.filter((override) => override.added.length > 0 || override.removed.length > 0);
}

function normalizeName(value: string) {
  return value.trim().toLowerCase();
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
