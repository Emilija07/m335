import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../firebase";

type Group = {
  id: string;
  name: string;
  persons: string[];
  expenses: any[];
};

const translations = {
  de: {
    overview: "Übersicht",
    title: "Deine Gruppen",
    subtitle:
      "Erstelle eine Gruppe für Reisen, Ausflüge oder gemeinsame Ausgaben.",
    newGroup: "Neue Gruppe",
    placeholder: "z. B. Mallorca 26",
    allGroups: "Alle Gruppen",
    noGroupsTitle: "Noch keine Gruppen",
    noGroupsText: "Erstelle deine erste Gruppe, um Ausgaben zu erfassen.",
    openGroup: "Gruppe öffnen",
    errorTitle: "Fehler",
    errorGroupName: "Bitte gib einen Gruppennamen ein.",
  },
  en: {
    overview: "Overview",
    title: "Your groups",
    subtitle: "Create a group for trips, activities or shared expenses.",
    newGroup: "New group",
    placeholder: "e.g. Mallorca 26",
    allGroups: "All groups",
    noGroupsTitle: "No groups yet",
    noGroupsText: "Create your first group to add expenses.",
    openGroup: "Open group",
    errorTitle: "Error",
    errorGroupName: "Please enter a group name.",
  },
};

export default function GroupsScreen() {
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState<"de" | "en">("de");

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadGroups();
    }, []),
  );

  async function loadSettings() {
    const savedTheme = await AsyncStorage.getItem("theme");
    const savedLanguage = await AsyncStorage.getItem("language");

    if (savedTheme) setTheme(savedTheme);

    if (savedLanguage === "de" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
  }

  async function loadGroups() {
    const guestMode = await AsyncStorage.getItem("guestMode");
    const user = auth.currentUser;

    if (guestMode === "true" || !user) {
      const savedGroups = await AsyncStorage.getItem("guestGroups");
      setGroups(savedGroups ? JSON.parse(savedGroups) : []);
      return;
    }

    const q = query(
      collection(db, "groups"),
      where("members", "array-contains", user.uid),
    );

    const snapshot = await getDocs(q);

    const data = snapshot.docs.map((docSnap) => {
      const item = docSnap.data();

      return {
        id: docSnap.id,
        name: item.name,
        persons: item.persons || [],
        expenses: item.expenses || [],
      };
    });

    setGroups(data);
  }

  async function addGroup() {
    try {
      const name = groupName.trim();

      if (!name) {
        Alert.alert(t.errorTitle, t.errorGroupName);
        return;
      }

      const guestMode = await AsyncStorage.getItem("guestMode");
      const user = auth.currentUser;

      if (guestMode === "true" || !user) {
        const savedGroups = await AsyncStorage.getItem("guestGroups");
        const oldGroups = savedGroups ? JSON.parse(savedGroups) : [];

        const newGroup = {
          id: Date.now().toString(),
          name,
          persons: [],
          expenses: [],
        };

        const updatedGroups = [...oldGroups, newGroup];

        await AsyncStorage.setItem(
          "guestGroups",
          JSON.stringify(updatedGroups),
        );
        setGroups(updatedGroups);
        setGroupName("");

        return;
      }

      await addDoc(collection(db, "groups"), {
        name,
        members: [user.uid],
        persons: [],
        expenses: [],
      });

      setGroupName("");
      await loadGroups();
    } catch (error) {
      console.log("Fehler beim Gruppe erstellen:", error);
      Alert.alert("Fehler", "Gruppe konnte nicht erstellt werden.");
    }
  }

  async function deleteGroup(id: string) {
    const user = auth.currentUser;

    if (!user) {
      const updatedGroups = groups.filter((group) => group.id !== id);
      setGroups(updatedGroups);
      await AsyncStorage.setItem("guestGroups", JSON.stringify(updatedGroups));
      return;
    }

    await deleteDoc(doc(db, "groups", id));
    await loadGroups();
  }

  const isDark = theme === "dark";
  const t = translations[language];

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Text style={[styles.pageLabel, isDark && styles.darkGreenText]}>
        {t.overview}
      </Text>

      <Text style={[styles.title, isDark && styles.darkTitle]}>{t.title}</Text>

      <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
        {t.subtitle}
      </Text>

      <View style={[styles.createCard, isDark && styles.darkCard]}>
        <Text style={[styles.cardTitle, isDark && styles.darkTitle]}>
          {t.newGroup}
        </Text>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            placeholder={t.placeholder}
            placeholderTextColor="#94A3B8"
            value={groupName}
            onChangeText={setGroupName}
          />

          <TouchableOpacity style={styles.addButton} onPress={addGroup}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, isDark && styles.darkTitle]}>
        {t.allGroups}
      </Text>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        contentContainerStyle={groups.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <View style={[styles.emptyBox, isDark && styles.darkCard]}>
            <Text style={styles.emptyIcon}>🧾</Text>

            <Text style={[styles.emptyTitle, isDark && styles.darkTitle]}>
              {t.noGroupsTitle}
            </Text>

            <Text style={[styles.emptyText, isDark && styles.darkSubtitle]}>
              {t.noGroupsText}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.groupCard, isDark && styles.darkCard]}
            onPress={() =>
              router.push({
                pathname: "/group",
                params: {
                  groupId: item.id,
                  groupName: item.name,
                  isGuest: "true",
                },
              } as any)
            }
          >
            <View style={styles.groupIcon}>
              <Text style={styles.groupIconText}>
                {item.name.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.groupInfo}>
              <Text style={[styles.groupTitle, isDark && styles.darkTitle]}>
                {item.name}
              </Text>
              <Text
                style={[styles.groupSubtitle, isDark && styles.darkSubtitle]}
              >
                {t.openGroup}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(event) => {
                event.stopPropagation();
                deleteGroup(item.id);
              }}
            >
              <Text style={styles.deleteText}>×</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
    paddingTop: 64,
  },
  darkContainer: {
    backgroundColor: "#0F172A",
  },
  pageLabel: {
    color: "#16A34A",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  darkGreenText: {
    color: "#22C55E",
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0F172A",
  },
  darkTitle: {
    color: "#FFFFFF",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    marginBottom: 24,
  },
  darkSubtitle: {
    color: "#CBD5E1",
  },
  createCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  darkCard: {
    backgroundColor: "#1E293B",
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 14,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    color: "#0F172A",
    padding: 15,
    borderRadius: 16,
    fontSize: 16,
  },
  darkInput: {
    backgroundColor: "#334155",
    color: "#FFFFFF",
  },
  addButton: {
    width: 54,
    backgroundColor: "#16A34A",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    marginTop: -2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },
  groupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  groupIconText: {
    color: "#16A34A",
    fontSize: 20,
    fontWeight: "900",
  },
  groupInfo: {
    flex: 1,
  },
  groupTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
  },
  groupSubtitle: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 3,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteText: {
    color: "#DC2626",
    fontSize: 24,
    fontWeight: "800",
    marginTop: -2,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  emptyBox: {
    alignItems: "center",
    padding: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
  },
  emptyIcon: {
    fontSize: 42,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },
  emptyText: {
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});
