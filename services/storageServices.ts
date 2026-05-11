import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
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

  // Neue Felder für geteilte Gruppen
  members?: string[]; // User-IDs
  memberUsernames?: string[]; // Usernames
  ownerId?: string;
};

const LOCAL_KEY = "guest_groups";

/**
 * Lädt alle Gruppen:
 * - Eingeloggt: eigene Gruppen + Gruppen, in denen der Benutzer Mitglied ist
 * - Guest: lokal
 */
export async function loadGroups(): Promise<Group[]> {
  const user = auth.currentUser;

  if (!user) {
    const data = await AsyncStorage.getItem(LOCAL_KEY);
    return data ? JSON.parse(data) : [];
  }

  const groupsMap = new Map<string, Group>();

  // Eigene Gruppen laden
  const ownSnapshot = await getDocs(
    collection(db, "users", user.uid, "groups"),
  );

  ownSnapshot.docs.forEach((document) => {
    const group = document.data() as Group;
    groupsMap.set(group.id, group);
  });

  // Gruppen laden, in denen der Benutzer Mitglied ist
  const sharedQuery = query(
    collection(db, "sharedGroups"),
    where("members", "array-contains", user.uid),
  );

  const sharedSnapshot = await getDocs(sharedQuery);

  sharedSnapshot.docs.forEach((document) => {
    const group = document.data() as Group;
    groupsMap.set(group.id, group);
  });

  return Array.from(groupsMap.values());
}

/**
 * Speichert eine Gruppe
 */
export async function saveGroup(group: Group) {
  const user = auth.currentUser;

  if (!user) {
    const groups = await loadGroups();
    const updated = groups.filter((g) => g.id !== group.id);
    updated.push(group);

    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    return;
  }

  const groupToSave: Group = {
    ...group,
    ownerId: group.ownerId ?? user.uid,
    members: group.members ?? [user.uid],
    memberUsernames: group.memberUsernames ?? [user.displayName || "unknown"],
  };

  // In eigener Collection speichern
  await setDoc(doc(db, "users", user.uid, "groups", group.id), groupToSave);

  // In sharedGroups speichern, damit andere Mitglieder sie sehen
  await setDoc(doc(db, "sharedGroups", group.id), groupToSave);
}

/**
 * Einzelne Gruppe laden
 */
export async function loadGroup(groupId: string): Promise<Group | null> {
  const groups = await loadGroups();
  return groups.find((group) => group.id === groupId) || null;
}

/**
 * Gruppe löschen
 */
export async function deleteGroup(groupId: string) {
  const user = auth.currentUser;

  if (!user) {
    const groups = await loadGroups();
    const updated = groups.filter((g) => g.id !== groupId);

    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
    return;
  }

  // Eigene Gruppe löschen
  await deleteDoc(doc(db, "users", user.uid, "groups", groupId));

  // Shared-Gruppe löschen
  await deleteDoc(doc(db, "sharedGroups", groupId));
}

/**
 * Benutzer anhand des Usernames zur Gruppe hinzufügen
 */
export async function addUserToGroup(
  groupId: string,
  username: string,
): Promise<boolean> {
  const cleanUsername = username.trim().toLowerCase();

  if (!cleanUsername) {
    return false;
  }

  // Username in Firestore suchen
  const usernameDoc = await getDoc(doc(db, "usernames", cleanUsername));

  if (!usernameDoc.exists()) {
    return false;
  }

  const { uid } = usernameDoc.data() as { uid: string };

  // Gruppe laden
  const group = await loadGroup(groupId);

  if (!group) {
    return false;
  }

  const members = group.members ?? [];
  const memberUsernames = group.memberUsernames ?? [];

  // Bereits Mitglied?
  if (members.includes(uid)) {
    return true;
  }

  // Mitglied hinzufügen
  const updatedGroup: Group = {
    ...group,
    persons: group.persons.includes(cleanUsername)
      ? group.persons
      : [...group.persons, cleanUsername],
    members: [...members, uid],
    memberUsernames: [...memberUsernames, cleanUsername],
  };

  // Gruppe erneut speichern
  await saveGroup(updatedGroup);

  // Kopie auch beim eingeladenen Benutzer speichern
  await setDoc(doc(db, "users", uid, "groups", groupId), updatedGroup);

  return true;
}
