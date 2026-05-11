import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { loadGroup, saveGroup } from "../services/storageServices";

type Expense = {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  shares: Record<string, number>;
};

const translations = {
  de: {
    back: "← Zurück",
    group: "Gruppe",
    people: "Personen",
    addPersonPlaceholder: "Name eingeben",
    noPeople: "Noch keine Personen hinzugefügt.",
    deletePersonHint: "Tipp: Person lange drücken, um sie zu löschen.",
    addExpense: "Ausgabe erfassen",
    descriptionPlaceholder: "Beschreibung z. B. Abendessen",
    amountPlaceholder: "Gesamtbetrag z. B. 70",
    paidBy: "Bezahlt von",
    consumedQuestion: "Wer hat wie viel konsumiert?",
    splitEqually: "Gleich aufteilen",
    addExpenseButton: "Ausgabe hinzufügen",
    expenses: "Ausgaben",
    noExpenses: "Noch keine Ausgaben erfasst.",
    paidByShort: "bezahlt von",
    delete: "Löschen",
    showResult: "Ergebnis anzeigen",
    resetGroup: "Gruppe zurücksetzen",
    error: "Fehler",
    enterName: "Bitte gib einen Namen ein.",
    personExists: "Diese Person existiert bereits.",
    validAmountFirst: "Bitte zuerst einen gültigen Gesamtbetrag eingeben.",
    minimumPeople: "Bitte füge mindestens zwei Personen hinzu.",
    enterDescription: "Bitte gib eine Beschreibung ein.",
    enterValidAmount: "Bitte gib einen gültigen Gesamtbetrag ein.",
    selectPayer: "Bitte wähle aus, wer bezahlt hat.",
    enterShares: "Bitte gib die Anteile der Personen ein.",
    sharesMustMatch: "Die Summe der Anteile muss",
    currently: "Aktuell sind es",
    calculationNeedsPeople: "Für die Berechnung braucht es mindestens zwei Personen.",
    calculationNeedsExpense: "Bitte erfasse zuerst mindestens eine Ausgabe.",
  },
  en: {
    back: "← Back",
    group: "Group",
    people: "People",
    addPersonPlaceholder: "Enter name",
    noPeople: "No people added yet.",
    deletePersonHint: "Tip: long press a person to delete them.",
    addExpense: "Add expense",
    descriptionPlaceholder: "Description e.g. Dinner",
    amountPlaceholder: "Total amount e.g. 70",
    paidBy: "Paid by",
    consumedQuestion: "Who consumed how much?",
    splitEqually: "Split equally",
    addExpenseButton: "Add expense",
    expenses: "Expenses",
    noExpenses: "No expenses added yet.",
    paidByShort: "paid by",
    delete: "Delete",
    showResult: "Show result",
    resetGroup: "Reset group",
    error: "Error",
    enterName: "Please enter a name.",
    personExists: "This person already exists.",
    validAmountFirst: "Please enter a valid total amount first.",
    minimumPeople: "Please add at least two people.",
    enterDescription: "Please enter a description.",
    enterValidAmount: "Please enter a valid total amount.",
    selectPayer: "Please select who paid.",
    enterShares: "Please enter each person's shares.",
    sharesMustMatch: "The sum of shares must be",
    currently: "Currently it is",
    calculationNeedsPeople: "At least two people are required for the calculation.",
    calculationNeedsExpense: "Please add at least one expense first.",
  },
};

export default function GroupScreen() {
  const params = useLocalSearchParams();
  const groupId = params.groupId as string;
  const groupName = (params.groupName as string) || "Gruppe";

  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState<"de" | "en">("de");
  const [currency, setCurrency] = useState("CHF");

  const [personName, setPersonName] = useState("");
  const [people, setPeople] = useState<string[]>([]);

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [shares, setShares] = useState<Record<string, string>>({});
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTheme();
    }, [])
  );

  useEffect(() => {
    setDataLoaded(false);
    loadData();
  }, [groupId]);

  useEffect(() => {
    if (groupId && dataLoaded) {
      saveData();
    }
  }, [people, expenses, groupId, dataLoaded]);

  async function loadTheme() {
    const savedTheme = await AsyncStorage.getItem("theme");
    const savedLanguage = await AsyncStorage.getItem("language");
    const savedCurrency = await AsyncStorage.getItem("currency");

    if (savedTheme) setTheme(savedTheme);

    if (savedCurrency) {setCurrency(savedCurrency);}

    if (savedLanguage === "de" || savedLanguage === "en") {
        setLanguage(savedLanguage);
    }
    
}

  async function loadData() {
    try {
      const group = await loadGroup(groupId);

      if (!group) {
        setDataLoaded(true);
        return;
      }

      setPeople(group.persons);
      setExpenses(group.expenses);

      if (group.persons.length > 0) {
        setPaidBy(group.persons[0]);
      }

      setDataLoaded(true);
    } catch (error) {
      console.log("Fehler beim Laden:", error);
      setDataLoaded(true);
    }
  }

  async function saveData() {
    try {
      await saveGroup({
        id: groupId,
        name: groupName,
        persons: people,
        expenses,
      });
    } catch (error) {
      console.log("Fehler beim Speichern:", error);
    }
  }

  function addPerson() {
    const name = personName.trim();

    if (!name) {
      Alert.alert(t.error, t.enterName);
      return;
    }

    if (people.includes(name)) {
      Alert.alert(t.error, t.personExists);
      return;
    }

    const updatedPeople = [...people, name];
    setPeople(updatedPeople);

    if (!paidBy) setPaidBy(name);

    setShares({
      ...shares,
      [name]: "",
    });

    setPersonName("");
  }

  function deletePerson(name: string) {
    const updatedPeople = people.filter((person) => person !== name);
    const updatedExpenses = expenses.filter((expense) => expense.paidBy !== name);

    const updatedShares = { ...shares };
    delete updatedShares[name];

    setPeople(updatedPeople);
    setExpenses(updatedExpenses);
    setShares(updatedShares);

    if (paidBy === name) {
      setPaidBy(updatedPeople.length > 0 ? updatedPeople[0] : "");
    }
  }

  function updateShare(person: string, value: string) {
    setShares({
      ...shares,
      [person]: value,
    });
  }

  function fillEqualShares() {
    const amount = Number(expenseAmount.replace(",", "."));

    if (isNaN(amount) || amount <= 0 || people.length === 0) {
      Alert.alert(t.error, t.validAmountFirst);
      return;
    }

    const equalShare = (amount / people.length).toFixed(2);
    const newShares: Record<string, string> = {};

    people.forEach((person) => {
      newShares[person] = equalShare;
    });

    setShares(newShares);
  }

  function addExpense() {
    const amount = Number(expenseAmount.replace(",", "."));

    if (people.length < 2) {
      Alert.alert(t.error, t.minimumPeople);
      return;
    }

    if (!expenseTitle.trim()) {
      Alert.alert(t.error, t.enterDescription);
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t.error, t.enterValidAmount);
      return;
    }

    if (!paidBy) {
      Alert.alert(t.error, t.selectPayer);
      return;
    }

    const numericShares: Record<string, number> = {};
    let sharesTotal = 0;

    people.forEach((person) => {
      const value = Number((shares[person] || "0").replace(",", "."));
      numericShares[person] = isNaN(value) ? 0 : value;
      sharesTotal += numericShares[person];
    });

    if (sharesTotal <= 0) {
      Alert.alert(t.error, t.enterShares);
      return;
    }

    if (Math.abs(sharesTotal - amount) > 0.05) {
      Alert.alert(
        t.error,
        `${t.sharesMustMatch} ${amount.toFixed(2)} {currency}. ${t.currently} ${sharesTotal.toFixed(2)} {currency}.`
      );
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      title: expenseTitle.trim(),
      amount,
      paidBy,
      shares: numericShares,
    };

    setExpenses([...expenses, newExpense]);
    setExpenseTitle("");
    setExpenseAmount("");

    const emptyShares: Record<string, string> = {};
    people.forEach((person) => {
      emptyShares[person] = "";
    });
    setShares(emptyShares);
  }

  function deleteExpense(id: string) {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  }

  async function resetAll() {
    setPeople([]);
    setExpenses([]);
    setPaidBy("");
    setShares({});

    await saveGroup({
      id: groupId,
      name: groupName,
      persons: [],
      expenses: [],
    });
  }

  function openResult() {
    if (people.length < 2) {
      Alert.alert(t.error, t.calculationNeedsPeople);
      return;
    }

    if (expenses.length === 0) {
      Alert.alert(t.error, t.calculationNeedsExpense);
      return;
    }

    router.push({
      pathname: "/result",
      params: {
        people: JSON.stringify(people),
        expenses: JSON.stringify(expenses),
        groupName,
      },
    } as any);
  }

  const isDark = theme === "dark";
  const t = translations[language];
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <ScrollView
      style={[styles.container, isDark && styles.darkContainer]}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>{t.back}</Text>
      </TouchableOpacity>

      <View style={[styles.headerCard, isDark && styles.darkCard]}>
        <Text style={styles.pageLabel}>{t.group}</Text>
        <Text style={[styles.title, isDark && styles.darkTitle]}>{groupName}</Text>
        <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
          {people.length} Personen · {expenses.length} Ausgaben · {total.toFixed(2)} {currency}
        </Text>
      </View>

      <View style={[styles.card, isDark && styles.darkCard]}>
        <Text style={[styles.cardTitle, isDark && styles.darkTitle]}>{t.people}</Text>

        <View style={styles.inputRow}>
          <TextInput
            style={[styles.input, isDark && styles.darkInput]}
            placeholder={t.addPersonPlaceholder}
            placeholderTextColor="#94A3B8"
            value={personName}
            onChangeText={setPersonName}
          />

          <TouchableOpacity style={styles.addButton} onPress={addPerson}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {people.length === 0 ? (
          <Text style={[styles.emptyText, isDark && styles.darkSubtitle]}>
            {t.noPeople}
          </Text>
        ) : (
          <View style={styles.chipContainer}>
            {people.map((person) => (
              <TouchableOpacity
                key={person}
                style={styles.personChip}
                onLongPress={() => deletePerson(person)}
              >
                <Text style={styles.personChipText}>{person}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {people.length > 0 && (
          <Text style={[styles.helperText, isDark && styles.darkSubtitle]}>
            Tipp: Person lange drücken, um sie zu löschen.
          </Text>
        )}
      </View>

      <View style={[styles.card, isDark && styles.darkCard]}>
        <Text style={[styles.cardTitle, isDark && styles.darkTitle]}>
          {t.addExpense}
        </Text>

        <TextInput
          style={[styles.fullInput, isDark && styles.darkInput]}
          placeholder={t.descriptionPlaceholder}
          placeholderTextColor="#94A3B8"
          value={expenseTitle}
          onChangeText={setExpenseTitle}
        />

        <TextInput
          style={[styles.fullInput, isDark && styles.darkInput]}
          placeholder={t.amountPlaceholder}
          placeholderTextColor="#94A3B8"
          keyboardType="numeric"
          value={expenseAmount}
          onChangeText={setExpenseAmount}
        />

        <Text style={[styles.label, isDark && styles.darkSubtitle]}>{t.paidBy}</Text>

        <View style={styles.chipContainer}>
          {people.map((person) => (
            <TouchableOpacity
              key={person}
              style={[styles.payerChip, paidBy === person && styles.payerChipActive]}
              onPress={() => setPaidBy(person)}
            >
              <Text
                style={[
                  styles.payerChipText,
                  paidBy === person && styles.payerChipTextActive,
                ]}
              >
                {person}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.shareHeader}>
          <Text style={[styles.label, isDark && styles.darkSubtitle]}>
            {t.consumedQuestion}
          </Text>

          <TouchableOpacity onPress={fillEqualShares}>
            <Text style={styles.equalText}>{t.splitEqually}</Text>
          </TouchableOpacity>
        </View>

        {people.map((person) => (
          <View key={person} style={[styles.shareRow, isDark && styles.darkSoftRow]}>
            <Text style={[styles.shareName, isDark && styles.darkTitle]}>{person}</Text>

            <TextInput
              style={[styles.shareInput, isDark && styles.darkInput]}
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={shares[person] || ""}
              onChangeText={(value) => updateShare(person, value)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.primaryButton} onPress={addExpense}>
          <Text style={styles.primaryButtonText}>{t.addExpenseButton}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, isDark && styles.darkCard]}>
        <Text style={[styles.cardTitle, isDark && styles.darkTitle]}>{t.expenses}</Text>

        {expenses.length === 0 ? (
          <Text style={[styles.emptyText, isDark && styles.darkSubtitle]}>
            {t.noExpenses}
          </Text>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={expenses}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.expenseRow, isDark && styles.darkSoftRow]}>
                <View style={styles.expenseIcon}>
                  <Text style={styles.expenseIconText}>{currency}</Text>
                </View>

                <View style={styles.expenseInfo}>
                  <Text style={[styles.expenseTitle, isDark && styles.darkTitle]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.expenseSubtitle, isDark && styles.darkSubtitle]}>
                    {item.amount.toFixed(2)} {currency} · {t.paidByShort} {item.paidBy}
                  </Text>
                </View>

                <TouchableOpacity onPress={() => deleteExpense(item.id)}>
                  <Text style={styles.deleteText}>{t.delete}</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity style={styles.primaryButtonLarge} onPress={openResult}>
        <Text style={styles.primaryButtonText}>{t.showResult}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.dangerButton} onPress={resetAll}>
        <Text style={styles.dangerButtonText}>{t.resetGroup}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  darkContainer: { backgroundColor: "#0F172A" },
  content: { padding: 24, paddingTop: 58, paddingBottom: 40 },
  backLink: { marginBottom: 14 },
  backLinkText: { color: "#16A34A", fontSize: 15, fontWeight: "700" },
  headerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  darkCard: { backgroundColor: "#1E293B" },
  darkSoftRow: { backgroundColor: "#334155" },
  pageLabel: {
    color: "#16A34A",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: { color: "#0F172A", fontSize: 34, fontWeight: "900" },
  darkTitle: { color: "#FFFFFF" },
  subtitle: { color: "#64748B", fontSize: 15, marginTop: 8 },
  darkSubtitle: { color: "#CBD5E1" },
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
  cardTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    color: "#0F172A",
    padding: 15,
    borderRadius: 16,
    fontSize: 16,
  },
  darkInput: { backgroundColor: "#475569", color: "#FFFFFF" },
  fullInput: {
    backgroundColor: "#F1F5F9",
    color: "#0F172A",
    padding: 15,
    borderRadius: 16,
    fontSize: 16,
    marginBottom: 10,
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
  emptyText: { color: "#64748B", lineHeight: 20 },
  helperText: { color: "#94A3B8", marginTop: 10, fontSize: 13 },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  personChip: {
    backgroundColor: "#DCFCE7",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  personChipText: { color: "#166534", fontWeight: "800" },
  label: {
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 4,
  },
  payerChip: {
    backgroundColor: "#F1F5F9",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  payerChipActive: { backgroundColor: "#16A34A" },
  payerChipText: { color: "#334155", fontWeight: "800" },
  payerChipTextActive: { color: "#FFFFFF" },
  shareHeader: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  equalText: { color: "#16A34A", fontWeight: "800" },
  shareRow: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  shareName: {
    flex: 1,
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 15,
  },
  shareInput: {
    width: 110,
    backgroundColor: "#FFFFFF",
    color: "#0F172A",
    padding: 12,
    borderRadius: 14,
    fontSize: 15,
    textAlign: "right",
  },
  primaryButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 14,
  },
  primaryButtonLarge: {
    backgroundColor: "#16A34A",
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 4,
    marginBottom: 12,
  },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 16 },
  expenseRow: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  expenseIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
  },
  expenseIconText: { color: "#16A34A", fontSize: 11, fontWeight: "900" },
  expenseInfo: { flex: 1 },
  expenseTitle: { color: "#0F172A", fontSize: 16, fontWeight: "800" },
  expenseSubtitle: { color: "#64748B", marginTop: 3, fontSize: 13 },
  deleteText: { color: "#DC2626", fontWeight: "800", fontSize: 12 },
  dangerButton: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },
  dangerButtonText: { color: "#DC2626", fontWeight: "900", fontSize: 15 },
});