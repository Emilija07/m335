import React, { useEffect, useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

import { translation } from "../constants/translation";

const language = "de"; // oder "en"
const t = translation[language as "de" | "en"];

export default function LoginScreen() {
  const [isRegister, setIsRegister] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);

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
      return "Die E-Mail-Adresse ist ungültig.";
    }

    if (code === "auth/email-already-in-use") {
      return "Diese E-Mail-Adresse ist bereits registriert.";
    }

    if (code === "auth/weak-password") {
      return "Das Passwort ist zu schwach. Es braucht mindestens 6 Zeichen.";
    }

    if (code === "auth/operation-not-allowed") {
      return "Email/Password ist in Firebase nicht aktiviert. Aktiviere es unter Authentication → Sign-in method.";
    }

    if (
      code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found"
    ) {
      return "E-Mail oder Passwort ist falsch.";
    }

    if (code === "auth/network-request-failed") {
      return "Netzwerkfehler. Prüfe deine Internetverbindung.";
    }

    return "Ein unbekannter Fehler ist aufgetreten.";
  };

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanEmail || !password) {
      Alert.alert("Fehler", "Bitte E-Mail und Passwort eingeben.");
      return;
    }

    if (isRegister && (!cleanFirstName || !cleanLastName)) {
      Alert.alert("Fehler", "Bitte Vorname und Nachname eingeben.");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Fehler", "Das Passwort muss mindestens 6 Zeichen haben.");
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
          "Registrierung erfolgreich",
          "Dein Konto wurde erstellt."
        );

        router.replace("/(tabs)/groups");
      } else {
        await signInWithEmailAndPassword(auth, cleanEmail, password);
        router.replace("/(tabs)/groups");
      }
    } catch (error: any) {
      console.log("Firebase Fehler:", error.code, error.message);

      Alert.alert(
        "Fehler",
        `${getErrorMessage(error.code)}\n\nCode: ${error.code ?? "unbekannt"}`
      );
    } finally {
      setButtonLoading(false);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1F8F3A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.logo}>QuickSplit</Text>

      <Text style={styles.subtitle}>{t.subtitle}</Text>

      <View style={styles.card}>
        <Text style={styles.title}>
          {isRegister ? t.signUp : t.signIn}
        </Text>

        {isRegister && (
          <>
            <TextInput
              style={styles.input}
              placeholder={t.firstName}
              placeholderTextColor="#888"
              value={firstName}
              onChangeText={setFirstName}
            />

            <TextInput
              style={styles.input}
              placeholder={t.lastName}
              placeholderTextColor="#888"
              value={lastName}
              onChangeText={setLastName}
            />
          </>
        )}

        <TextInput
          style={styles.input}
          placeholder={t.email}
          placeholderTextColor="#888"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          style={styles.input}
          placeholder={t.password}
          placeholderTextColor="#888"
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
            <ActivityIndicator color="#FFF" />
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
    backgroundColor: "#F6F8F6",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#1F8F3A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 32,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#222",
    textAlign: "center",
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  primaryButton: {
    height: 52,
    backgroundColor: "#1F8F3A",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchText: {
    color: "#1F8F3A",
    textAlign: "center",
    marginTop: 16,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 20,
  },
  guestButton: {
    height: 50,
    borderWidth: 1,
    borderColor: "#1F8F3A",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  guestButtonText: {
    color: "#1F8F3A",
    fontSize: 16,
    fontWeight: "bold",
  },
});