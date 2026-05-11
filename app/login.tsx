import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { translation } from "../constants/translation";
import { auth } from "../firebase";

export default function LoginScreen() {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState<"de" | "en">("de");

  const [isRegister, setIsRegister] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [])
  );

  async function loadSettings() {
    const savedTheme = await AsyncStorage.getItem("theme");
    const savedLanguage = await AsyncStorage.getItem("language");

    if (savedTheme) {
      setTheme(savedTheme);
    }

    if (savedLanguage === "de" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
  }

  const isDark = theme === "dark";
  const t = translation[language];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/(tabs)/groups");
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const continueAsGuest = () => {
    router.replace("/(tabs)/groups");
  };

  const getErrorMessage = (code?: string) => {
    if (code === "auth/invalid-email") {
      return language === "de"
        ? "Die E-Mail-Adresse ist ungültig."
        : "The email address is invalid.";
    }

    if (code === "auth/email-already-in-use") {
      return language === "de"
        ? "Diese E-Mail-Adresse ist bereits registriert."
        : "This email address is already registered.";
    }

    if (code === "auth/weak-password") {
      return language === "de"
        ? "Das Passwort muss mindestens 6 Zeichen haben."
        : "Password must contain at least 6 characters.";
    }

    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found"
    ) {
      return language === "de"
        ? "E-Mail oder Passwort ist falsch."
        : "Email or password is incorrect.";
    }

    if (code === "auth/network-request-failed") {
      return language === "de"
        ? "Netzwerkfehler. Prüfe deine Verbindung."
        : "Network error. Check your connection.";
    }

    return language === "de"
      ? "Ein unbekannter Fehler ist aufgetreten."
      : "An unknown error occurred.";
  };

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanEmail || !password) {
      Alert.alert(
        language === "de" ? "Fehler" : "Error",
        language === "de"
          ? "Bitte E-Mail und Passwort eingeben."
          : "Please enter email and password."
      );
      return;
    }

    if (isRegister && (!cleanFirstName || !cleanLastName)) {
      Alert.alert(
        language === "de" ? "Fehler" : "Error",
        language === "de"
          ? "Bitte Vorname und Nachname eingeben."
          : "Please enter first and last name."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        language === "de" ? "Fehler" : "Error",
        language === "de"
          ? "Das Passwort muss mindestens 6 Zeichen haben."
          : "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setButtonLoading(true);

      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

        await updateProfile(userCredential.user, {
          displayName: `${cleanFirstName} ${cleanLastName}`,
        });

        Alert.alert(
          language === "de"
            ? "Registrierung erfolgreich"
            : "Registration successful",
          language === "de"
            ? "Dein Konto wurde erstellt."
            : "Your account has been created."
        );

        router.replace("/(tabs)/groups");
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);

        router.replace("/(tabs)/groups");
      }
    } catch (error: any) {
      console.log("Firebase Fehler:", error.code, error.message);

      Alert.alert(
        language === "de" ? "Fehler" : "Error",
        getErrorMessage(error.code)
      );
    } finally {
      setButtonLoading(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, isDark && styles.darkContainer]}
      >
        <ActivityIndicator size="large" color="#16A34A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.darkContainer]}
    >
      <Text style={styles.logo}>💸 QuickSplit</Text>

      <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
        {t.subtitle}
      </Text>

      <View style={[styles.card, isDark && styles.darkCard]}>
        <Text style={[styles.title, isDark && styles.darkTitle]}>
          {isRegister ? t.signUp : t.signIn}
        </Text>

        {isRegister && (
          <>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder={t.firstName}
              placeholderTextColor="#94A3B8"
              value={firstName}
              onChangeText={setFirstName}
            />

            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              placeholder={t.lastName}
              placeholderTextColor="#94A3B8"
              value={lastName}
              onChangeText={setLastName}
            />
          </>
        )}

        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          placeholder={t.email}
          placeholderTextColor="#94A3B8"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={[styles.input, isDark && styles.darkInput]}
          placeholder={t.password}
          placeholderTextColor="#94A3B8"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSubmit}
          disabled={buttonLoading}
        >
          {buttonLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {isRegister ? t.createAccount : t.signIn}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegister(!isRegister)}>
          <Text style={styles.switchText}>
            {isRegister ? t.alreadyHaveAccount : t.noAccount}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.guestButton}
          onPress={continueAsGuest}
        >
          <Text style={styles.guestButtonText}>
            {t.continueAsGuest}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    padding: 24,
  },

  darkContainer: {
    backgroundColor: "#0F172A",
  },

  logo: {
    fontSize: 38,
    fontWeight: "900",
    color: "#16A34A",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },

  darkSubtitle: {
    color: "#CBD5E1",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 6,
  },

  darkCard: {
    backgroundColor: "#1E293B",
  },

  title: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 22,
    color: "#0F172A",
    textAlign: "center",
  },

  darkTitle: {
    color: "#FFFFFF",
  },

  input: {
    height: 56,
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
    height: 56,
    backgroundColor: "#16A34A",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  switchText: {
    color: "#16A34A",
    textAlign: "center",
    marginTop: 18,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 22,
  },

  guestButton: {
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#16A34A",
    justifyContent: "center",
    alignItems: "center",
  },

  guestButtonText: {
    color: "#16A34A",
    fontSize: 16,
    fontWeight: "800",
  },
});