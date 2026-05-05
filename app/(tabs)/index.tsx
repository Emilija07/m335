import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const translations = {
  de: {
    title: "QuickSplit",
    subtitle:
      "Erstelle Gruppen, erfasse Ausgaben und sieh sofort, wer wem wie viel schuldet.",
    button: "Gruppen öffnen",
    infoTitle: "Schnell. Einfach. Fair.",
    infoText: "Ideal für Reisen, Restaurantbesuche und gemeinsame Aktivitäten.",
  },
  en: {
    title: "QuickSplit",
    subtitle:
      "Create groups, add expenses and instantly see who owes whom how much.",
    button: "Open groups",
    infoTitle: "Fast. Simple. Fair.",
    infoText: "Perfect for trips, restaurants and shared activities.",
  },
};

export default function HomeScreen() {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState<"de" | "en">("de");

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  async function loadSettings() {
    const savedTheme = await AsyncStorage.getItem("theme");
    const savedLanguage = await AsyncStorage.getItem("language");

    if (savedTheme) setTheme(savedTheme);

    if (savedLanguage === "de" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
  }

  const isDark = theme === "dark";
  const t = translations[language];

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <View style={[styles.heroCard, isDark && styles.darkCard]}>
        <Text style={styles.logo}>💸</Text>

        <Text style={[styles.title, isDark && styles.darkTitle]}>
          {t.title}
        </Text>

        <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
          {t.subtitle}
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/groups")}
        >
          <Text style={styles.primaryButtonText}>{t.button}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.infoBox, isDark && styles.darkInfoBox]}>
        <Text style={[styles.infoTitle, isDark && styles.darkInfoTitle]}>
          {t.infoTitle}
        </Text>

        <Text style={[styles.infoText, isDark && styles.darkInfoText]}>
          {t.infoText}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 24,
    justifyContent: "center",
  },
  darkContainer: {
    backgroundColor: "#0F172A",
  },
  heroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  darkCard: {
    backgroundColor: "#1E293B",
  },
  logo: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 40,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 10,
  },
  darkTitle: {
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
  },
  darkSubtitle: {
    color: "#CBD5E1",
  },
  primaryButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 18,
    width: "100%",
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
  infoBox: {
    marginTop: 20,
    backgroundColor: "#ECFDF5",
    borderRadius: 22,
    padding: 18,
  },
  darkInfoBox: {
    backgroundColor: "#064E3B",
  },
  infoTitle: {
    color: "#065F46",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  darkInfoTitle: {
    color: "#D1FAE5",
  },
  infoText: {
    color: "#047857",
    fontSize: 14,
    lineHeight: 20,
  },
  darkInfoText: {
    color: "#A7F3D0",
  },
});