import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const translations = {
  de: {
    settings: "Einstellungen",
    customize: "App anpassen",
    subtitle: "Passe Darstellung und Sprache von QuickSplit an.",
    design: "Design",
    light: "Hell",
    dark: "Dunkel",
    language: "Sprache",
    german: "Deutsch",
    english: "English",
    features: "Weitere mögliche Features",
    featureList:
      "• Währung auswählen: CHF, EUR, USD\n• Daten zurücksetzen\n• Export als PDF oder Screenshot\n• Standard-Sprache speichern\n• App-Version anzeigen",
  },
  en: {
    settings: "Settings",
    customize: "Customize app",
    subtitle: "Customize the appearance and language of QuickSplit.",
    design: "Design",
    light: "Light",
    dark: "Dark",
    language: "Language",
    german: "German",
    english: "English",
    features: "Possible future features",
    featureList:
      "• Select currency: CHF, EUR, USD\n• Reset data\n• Export as PDF or screenshot\n• Save default language\n• Show app version",
  },
};

export default function SettingsScreen() {
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

  async function changeTheme(value: string) {
    setTheme(value);
    await AsyncStorage.setItem("theme", value);
  }

  async function changeLanguage(value: "de" | "en") {
    setLanguage(value);
    await AsyncStorage.setItem("language", value);
  }

  const isDark = theme === "dark";
  const t = translations[language];

  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <Text style={[styles.pageLabel, isDark && styles.darkGreenText]}>
        {t.settings}
      </Text>

      <Text style={[styles.title, isDark && styles.darkTitle]}>
        {t.customize}
      </Text>

      <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
        {t.subtitle}
      </Text>

      <View style={[styles.card, isDark && styles.darkCard]}>
        <Text style={[styles.cardTitle, isDark && styles.darkTitle]}>
          {t.design}
        </Text>

        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              theme === "light" && styles.optionButtonActive,
            ]}
            onPress={() => changeTheme("light")}
          >
            <Text
              style={[
                styles.optionText,
                theme === "light" && styles.optionTextActive,
              ]}
            >
              {t.light}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              theme === "dark" && styles.optionButtonActive,
            ]}
            onPress={() => changeTheme("dark")}
          >
            <Text
              style={[
                styles.optionText,
                theme === "dark" && styles.optionTextActive,
              ]}
            >
              {t.dark}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, isDark && styles.darkCard]}>
        <Text style={[styles.cardTitle, isDark && styles.darkTitle]}>
          {t.language}
        </Text>

        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              language === "de" && styles.optionButtonActive,
            ]}
            onPress={() => changeLanguage("de")}
          >
            <Text
              style={[
                styles.optionText,
                language === "de" && styles.optionTextActive,
              ]}
            >
              {t.german}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              language === "en" && styles.optionButtonActive,
            ]}
            onPress={() => changeLanguage("en")}
          >
            <Text
              style={[
                styles.optionText,
                language === "en" && styles.optionTextActive,
              ]}
            >
              {t.english}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.infoCard, isDark && styles.darkInfoCard]}>
        <Text style={[styles.infoTitle, isDark && styles.darkTitle]}>
          {t.features}
        </Text>

        <Text style={[styles.infoText, isDark && styles.darkSubtitle]}>
          {t.featureList}
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  darkCard: {
    backgroundColor: "#1E293B",
  },
  cardTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },
  optionRow: {
    flexDirection: "row",
    gap: 10,
  },
  optionButton: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  optionButtonActive: {
    backgroundColor: "#16A34A",
  },
  optionText: {
    color: "#334155",
    fontWeight: "800",
  },
  optionTextActive: {
    color: "#FFFFFF",
  },
  infoCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 22,
    padding: 18,
    marginTop: 6,
  },
  darkInfoCard: {
    backgroundColor: "#064E3B",
  },
  infoTitle: {
    color: "#065F46",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 8,
  },
  infoText: {
    color: "#047857",
    fontSize: 14,
    lineHeight: 22,
  },
});