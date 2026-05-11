import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";

export type Expense = {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  shares: Record<string, number>;
};

export type Group = {
  id: string;
  name: string;
  persons: string[];
  expenses: Expense[];
};

const LOCAL_KEY = "guest_groups";

function normalizeGroup(data: any): Group {
  return {
    id: String(data.id),
    name: String(data.name ?? "Gruppe"),
    persons: Array.isArray(data.persons) ? data.persons : [],
    expenses: Array.isArray(data.expenses) ? data.expenses : [],
  };
}

async function loadLegacyGuestGroups(): Promise<Group[]> {
  const legacyData = await AsyncStorage.getItem("groups");
  if (!legacyData) return [];

  const legacyGroups = JSON.parse(legacyData);

  const migratedGroups = await Promise.all(
    legacyGroups.map(async (group: any) => {
      const savedPeople = await AsyncStorage.getItem(`people_${group.id}`);
      const savedExpenses = await AsyncStorage.getItem(`expenses_${group.id}`);

      return normalizeGroup({
        ...group,
        persons: savedPeople ? JSON.parse(savedPeople) : [],
        expenses: savedExpenses ? JSON.parse(savedExpenses) : [],
      });
    })
  );

  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(migratedGroups));
  return migratedGroups;
}

export async function loadGroups(): Promise<Group[]> {
  const user = auth.currentUser;

  if (user) {
    const snapshot = await getDocs(collection(db, "users", user.uid, "groups"));
    return snapshot.docs.map((document) =>
      normalizeGroup({ id: document.id, ...document.data() })
    );
  }

  const data = await AsyncStorage.getItem(LOCAL_KEY);
  if (data) return JSON.parse(data).map(normalizeGroup);

  return await loadLegacyGuestGroups();
}

export async function loadGroup(groupId: string): Promise<Group | null> {
  const user = auth.currentUser;

  if (user) {
    const groupRef = doc(db, "users", user.uid, "groups", groupId);
    const snapshot = await getDoc(groupRef);

    if (!snapshot.exists()) return null;

    return normalizeGroup({ id: snapshot.id, ...snapshot.data() });
  }

  const groups = await loadGroups();
  return groups.find((group) => group.id === groupId) ?? null;
}

export async function saveGroup(group: Group) {
  const user = auth.currentUser;
  const normalizedGroup = normalizeGroup(group);

  if (user) {
    await setDoc(
      doc(db, "users", user.uid, "groups", normalizedGroup.id),
      normalizedGroup
    );
    return;
  }

  const groups = await loadGroups();
  const updatedGroups = groups.filter((item) => item.id !== normalizedGroup.id);
  updatedGroups.push(normalizedGroup);

  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updatedGroups));
}

export async function deleteGroup(groupId: string) {
  const user = auth.currentUser;

  if (user) {
    await deleteDoc(doc(db, "users", user.uid, "groups", groupId));
    return;
  }

  const groups = await loadGroups();
  const updatedGroups = groups.filter((group) => group.id !== groupId);

  await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updatedGroups));
}
