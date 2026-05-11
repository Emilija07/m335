import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import {
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  User,
} from "firebase/auth";

import { useCallback, useEffect, useState } from "react";

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { auth } from "../../firebase";

const handleLogout = async () => {
  await signOut(auth);
  router.replace("../login");
};

const translations = {
  de: {
    currency: "Währung",
    automatic: "Automatisch",
    manual: "Manuell",
    settings: "Einstellungen",
    customize: "App anpassen",
    subtitle: "Passe Darstellung und Sprache von QuickSplit an.",

    design: "Design",
    light: "Hell",
    dark: "Dunkel",

    language: "Sprache",
    german: "Deutsch",
    english: "English",

    login: "Anmeldung",
    logout: "Ausloggen",

    account: "Account",
    loggedInAs: "Angemeldet als",
    email: "E-Mail",

    changePassword: "Passwort ändern",
    currentPassword: "Aktuelles Passwort",
    newPassword: "Neues Passwort",
    confirmPassword: "Passwort bestätigen",
    savePassword: "Passwort speichern",

    passwordChanged: "Passwort erfolgreich geändert.",
    passwordsNotMatch:
      "Die neuen Passwörter stimmen nicht überein.",
    passwordTooShort:
      "Das Passwort muss mindestens 6 Zeichen haben.",
    enterAllFields:
      "Bitte alle Felder ausfüllen.",
    wrongCurrentPassword:
      "Das aktuelle Passwort ist falsch.",

    features: "Weitere mögliche Features",

    featureList:
      "• Währung auswählen: CHF, EUR, USD\n• Daten zurücksetzen\n• Export als PDF oder Screenshot\n• Standard-Sprache speichern\n• App-Version anzeigen",
  },

  en: {

    currency: "Currency",
    automatic: "Automatic",
    manual: "Manual",
    settings: "Settings",
    customize: "Customize app",
    subtitle:
      "Customize the appearance and language of QuickSplit.",

    design: "Design",
    light: "Light",
    dark: "Dark",

    language: "Language",
    german: "German",
    english: "English",

    login: "Login",
    logout: "Logout",

    account: "Account",
    loggedInAs: "Logged in as",
    email: "Email",

    changePassword: "Change password",
    currentPassword: "Current password",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    savePassword: "Save password",

    passwordChanged:
      "Password changed successfully.",

    passwordsNotMatch:
      "The new passwords do not match.",

    passwordTooShort:
      "Password must contain at least 6 characters.",

    enterAllFields:
      "Please fill in all fields.",

    wrongCurrentPassword:
      "Current password is incorrect.",

    features: "Possible future features",

    featureList:
      "• Select currency: CHF, EUR, USD\n• Reset data\n• Export as PDF or screenshot\n• Save default language\n• Show app version",
  },
};

export default function SettingsScreen() {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] =
    useState<"de" | "en">("de");

  const [currency, setCurrency] =
    useState("CHF");

  const [currencyMode, setCurrencyMode] =
    useState<"manual" | "auto">(
      "manual"
    );

  const [isGuest, setIsGuest] = useState(false);

  const [userData, setUserData] =
    useState<User | null>(null);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setIsGuest(!user);
        setUserData(user);
      }
    );

    return unsubscribe;
  }, []);

  async function loadSettings() {
    const savedTheme =
      await AsyncStorage.getItem("theme");

    const savedLanguage =
      await AsyncStorage.getItem("language");

    const savedCurrency =
      await AsyncStorage.getItem("currency");

    const savedCurrencyMode =
      await AsyncStorage.getItem(
        "currencyMode"
      );

    if (savedTheme) {
      setTheme(savedTheme);
    }

    if (savedCurrency) {
      setCurrency(savedCurrency);
    }

    if (
      savedCurrencyMode === "manual" ||
      savedCurrencyMode === "auto"
    ) {
      setCurrencyMode(
        savedCurrencyMode
      );
    }

    if (
      savedLanguage === "de" ||
      savedLanguage === "en"
    ) {
      setLanguage(savedLanguage);
    }
  }

  async function changeTheme(value: string) {
    setTheme(value);

    await AsyncStorage.setItem(
      "theme",
      value
    );
  }

  async function changeLanguage(
    value: "de" | "en"
  ) {
    setLanguage(value);

    await AsyncStorage.setItem(
      "language",
      value
    );
  }

  async function changeCurrency(
    value: string
  ) {
    setCurrency(value);

    await AsyncStorage.setItem(
      "currency",
      value
    );
  }

  async function enableAutoCurrency() {
    const permission =
      await Location.requestForegroundPermissionsAsync();

    if (
      permission.status !== "granted"
    ) {
      return;
    }

    const location =
      await Location.getCurrentPositionAsync(
        {}
      );

    const reverse =
      await Location.reverseGeocodeAsync({
        latitude:
          location.coords.latitude,
        longitude:
          location.coords.longitude,
      });

    const country =
      reverse[0]?.isoCountryCode;

    let detectedCurrency = "CHF";

    if (country === "CH")
      detectedCurrency = "CHF";

    if (
      country === "DE" ||
      country === "FR" ||
      country === "IT" ||
      country === "AT"
    ) {
      detectedCurrency = "EUR";
    }

    if (country === "US")
      detectedCurrency = "USD";

    if (country === "GB")
      detectedCurrency = "GBP";

    setCurrencyMode("auto");
    setCurrency(detectedCurrency);

    await AsyncStorage.setItem(
      "currencyMode",
      "auto"
    );

    await AsyncStorage.setItem(
      "currency",
      detectedCurrency
    );
  }

  async function handleChangePassword() {
    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      Alert.alert(
        language === "de" ? "Fehler" : "Error",
        t.enterAllFields
      );
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(
        language === "de" ? "Fehler" : "Error",
        t.passwordTooShort
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(
        language === "de" ? "Fehler" : "Error",
        t.passwordsNotMatch
      );
      return;
    }

    try {
      const user = auth.currentUser;

      if (!user || !user.email) {
        Alert.alert(
          language === "de" ? "Fehler" : "Error",
          language === "de"
            ? "Kein Benutzer gefunden."
            : "No user found."
        );

        return;
      }

      const credential =
        EmailAuthProvider.credential(
          user.email.trim(),
          currentPassword.trim()
        );

      await reauthenticateWithCredential(
        user,
        credential
      );

      await updatePassword(
        user,
        newPassword.trim()
      );

      Alert.alert(
        language === "de"
          ? "Erfolg"
          : "Success",

        t.passwordChanged
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

    } catch (error: any) {
      console.log("PASSWORD ERROR:", error);

      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        Alert.alert(
          language === "de" ? "Fehler" : "Error",
          t.wrongCurrentPassword
        );

        return;
      }

      if (error.code === "auth/too-many-requests") {
        Alert.alert(
          language === "de" ? "Fehler" : "Error",
          language === "de"
            ? "Zu viele Versuche. Bitte später erneut versuchen."
            : "Too many attempts. Please try again later."
        );

        return;
      }

      Alert.alert(
        language === "de" ? "Fehler" : "Error",
        error.message
      );
    }
  }

  const isDark = theme === "dark";
  const t = translations[language];

  return (
    <ScrollView
        style={[
          styles.container,
          isDark && styles.darkContainer,
        ]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
      <Text
        style={[
          styles.pageLabel,
          isDark && styles.darkGreenText,
        ]}
      >
        {t.settings}
      </Text>

      <Text
        style={[
          styles.title,
          isDark && styles.darkTitle,
        ]}
      >
        {t.customize}
      </Text>

      <Text
        style={[
          styles.subtitle,
          isDark && styles.darkSubtitle,
        ]}
      >
        {t.subtitle}
      </Text>

      <View
        style={[
          styles.card,
          isDark && styles.darkCard,
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            isDark && styles.darkTitle,
          ]}
        >
          {t.design}
        </Text>

        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              theme === "light" &&
                styles.optionButtonActive,
            ]}
            onPress={() =>
              changeTheme("light")
            }
          >
            <Text
              style={[
                styles.optionText,
                theme === "light" &&
                  styles.optionTextActive,
              ]}
            >
              {t.light}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              theme === "dark" &&
                styles.optionButtonActive,
            ]}
            onPress={() =>
              changeTheme("dark")
            }
          >
            <Text
              style={[
                styles.optionText,
                theme === "dark" &&
                  styles.optionTextActive,
              ]}
            >
              {t.dark}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.card,
          isDark && styles.darkCard,
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            isDark && styles.darkTitle,
          ]}
        >
          {t.language}
        </Text>

        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              language === "de" &&
                styles.optionButtonActive,
            ]}
            onPress={() =>
              changeLanguage("de")
            }
          >
            <Text
              style={[
                styles.optionText,
                language === "de" &&
                  styles.optionTextActive,
              ]}
            >
              {t.german}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              language === "en" &&
                styles.optionButtonActive,
            ]}
            onPress={() =>
              changeLanguage("en")
            }
          >
            <Text
              style={[
                styles.optionText,
                language === "en" &&
                  styles.optionTextActive,
              ]}
            >
              {t.english}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View
        style={[
          styles.card,
          isDark && styles.darkCard,
        ]}
      >
        <Text
          style={[
            styles.cardTitle,
            isDark && styles.darkTitle,
          ]}
        >
          {t.currency}
        </Text>

        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              currencyMode === "auto" &&
                styles.optionButtonActive,
            ]}
            onPress={enableAutoCurrency}
          >
            <Text
              style={[
                styles.optionText,
                currencyMode === "auto" &&
                  styles.optionTextActive,
              ]}
            >
              🌍 {t.automatic}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              currencyMode === "manual" &&
                styles.optionButtonActive,
            ]}
            onPress={async () => {
              setCurrencyMode("manual");

              await AsyncStorage.setItem(
                "currencyMode",
                "manual"
              );
            }}
          >
            <Text
              style={[
                styles.optionText,
                currencyMode === "manual" &&
                  styles.optionTextActive,
              ]}
            >
              💰 {t.manual}
            </Text>
          </TouchableOpacity>
        </View>

        {currencyMode === "manual" && (
          <View
            style={[
              styles.optionRow,
              { marginTop: 12 },
            ]}
          >
            {["CHF", "EUR", "USD", "GBP"].map(
              (item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.optionButton,
                    currency === item &&
                      styles.optionButtonActive,
                  ]}
                  onPress={() =>
                    changeCurrency(item)
                  }
                >
                  <Text
                    style={[
                      styles.optionText,
                      currency === item &&
                        styles.optionTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </View>

      {!isGuest && userData && (
        <View
          style={[
            styles.card,
            isDark && styles.darkCard,
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              isDark && styles.darkTitle,
            ]}
          >
            {t.account}
          </Text>

          <View style={styles.accountRow}>
            <Text
              style={[
                styles.accountLabel,
                isDark &&
                  styles.darkSubtitle,
              ]}
            >
              {t.loggedInAs}
            </Text>

            <Text
              style={[
                styles.accountValue,
                isDark &&
                  styles.darkTitle,
              ]}
            >
              {userData.displayName || "-"}
            </Text>
          </View>

          <View style={styles.accountRow}>
            <Text
              style={[
                styles.accountLabel,
                isDark &&
                  styles.darkSubtitle,
              ]}
            >
              {t.email}
            </Text>

            <Text
              style={[
                styles.accountValue,
                isDark &&
                  styles.darkTitle,
              ]}
            >
              {userData.email || "-"}
            </Text>
          </View>
        </View>
      )}

      {!isGuest && (
        <View
          style={[
            styles.card,
            isDark && styles.darkCard,
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              isDark && styles.darkTitle,
            ]}
          >
            {t.changePassword}
          </Text>

          <TextInput
            style={[
              styles.input,
              isDark && styles.darkInput,
            ]}
            placeholder={t.currentPassword}
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={currentPassword}
            onChangeText={
              setCurrentPassword
            }
          />

          <TextInput
            style={[
              styles.input,
              isDark && styles.darkInput,
            ]}
            placeholder={t.newPassword}
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={newPassword}
            onChangeText={
              setNewPassword
            }
          />

          <TextInput
            style={[
              styles.input,
              isDark && styles.darkInput,
            ]}
            placeholder={t.confirmPassword}
            placeholderTextColor="#94A3B8"
            secureTextEntry
            value={confirmPassword}
            onChangeText={
              setConfirmPassword
            }
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={
              handleChangePassword
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {t.savePassword}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.logoutContainer}>
        {isGuest ? (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={() =>
              router.replace("/login")
            }
          >
            <Text style={styles.logoutText}>
              {t.login}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>
              {t.logout}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View
        style={[
          styles.infoCard,
          isDark && styles.darkInfoCard,
        ]}
      >
        <Text
          style={[
            styles.infoTitle,
            isDark && styles.darkTitle,
          ]}
        >
          {t.features}
        </Text>

        <Text
          style={[
            styles.infoText,
            isDark &&
              styles.darkSubtitle,
          ]}
        >
          {t.featureList}
        </Text>
      </View>
    </ScrollView>
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
    shadowOffset: {
      width: 0,
      height: 5,
    },
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

  accountRow: {
    marginBottom: 14,
  },

  accountLabel: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 4,
    fontWeight: "700",
  },

  accountValue: {
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "800",
  },

  input: {
    height: 54,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: "#F8FAFC",
    color: "#0F172A",
  },

  darkInput: {
    backgroundColor: "#334155",
    borderColor: "#475569",
    color: "#FFFFFF",
  },

  primaryButton: {
    backgroundColor: "#16A34A",
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  logoutContainer: {
    marginTop: 10,
    marginBottom: 18,
  },

  logoutButton: {
    backgroundColor: "#DC2626",
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
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
    marginBottom: 4,
  },

  infoText: {
    color: "#047857",
    fontSize: 14,
    lineHeight: 22,
  },

  scrollContent: {
    paddingBottom: 40,
  },
});