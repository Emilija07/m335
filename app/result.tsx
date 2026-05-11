import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Expense = {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  shares: Record<string, number>;
};

export default function ResultScreen() {
  const params = useLocalSearchParams();
  const [theme, setTheme] = useState("light");
  const [currency, setCurrency] = useState("CHF");

  useFocusEffect(
    useCallback(() => {
      loadTheme();
    }, [])
  );

  async function loadTheme() {
    const savedTheme =
      await AsyncStorage.getItem(
        "theme"
      );

    const savedCurrency =
      await AsyncStorage.getItem(
        "currency"
      );

    if (savedTheme)
      setTheme(savedTheme);

    if (savedCurrency)
      setCurrency(savedCurrency);
  }

  const isDark = theme === "dark";
  const groupName = (params.groupName as string) || "Gruppe";

  const people: string[] = params.people
    ? JSON.parse(params.people as string)
    : [];

  const expenses: Expense[] = params.expenses
    ? JSON.parse(params.expenses as string)
    : [];

  const paidTotals: Record<string, number> = {};
  const consumedTotals: Record<string, number> = {};
  const balances: Record<string, number> = {};

  people.forEach((person) => {
    paidTotals[person] = 0;
    consumedTotals[person] = 0;
    balances[person] = 0;
  });

  expenses.forEach((expense) => {
    paidTotals[expense.paidBy] += expense.amount;

    people.forEach((person) => {
      consumedTotals[person] += expense.shares?.[person] || 0;
    });
  });

  people.forEach((person) => {
    balances[person] = paidTotals[person] - consumedTotals[person];
  });

  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const creditors = Object.entries(balances)
    .filter(([, balance]) => balance > 0.01)
    .map(([name, amount]) => ({ name, amount }));

  const debtors = Object.entries(balances)
    .filter(([, balance]) => balance < -0.01)
    .map(([name, amount]) => ({ name, amount: Math.abs(amount) }));

  const settlements: string[] = [];

  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];

    const amount = Math.min(creditor.amount, debtor.amount);

    settlements.push(
      `${debtor.name} schuldet ${creditor.name} ${amount.toFixed(2)} ${currency}`
    );

    creditor.amount -= amount;
    debtor.amount -= amount;

    if (creditor.amount <= 0.01) creditorIndex++;
    if (debtor.amount <= 0.01) debtorIndex++;
  }

  return (
    <ScrollView
      style={[styles.container, isDark && styles.darkContainer]}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
        <Text style={styles.backLinkText}>← Zurück</Text>
      </TouchableOpacity>

      <View style={[styles.headerCard, isDark && styles.darkCard]}>
        <Text style={styles.pageLabel}>Abrechnung</Text>

        <Text style={[styles.title, isDark && styles.darkTitle]}>
          {groupName}
        </Text>

        <Text style={[styles.subtitle, isDark && styles.darkSubtitle]}>
          {people.length} Personen · {expenses.length} Ausgaben
        </Text>
      </View>

      <View style={[styles.summaryCard, isDark && styles.darkSummaryCard]}>
        <Text style={[styles.summaryLabel, isDark && styles.darkSummaryLabel]}>
          Gesamtausgaben
        </Text>

        <Text style={[styles.summaryValue, isDark && styles.darkSummaryValue]}>
          {total.toFixed(2)} {currency}
        </Text>
      </View>

      <View style={[styles.card, isDark && styles.darkCard]}>
        <Text style={[styles.cardTitle, isDark && styles.darkTitle]}>
          Übersicht pro Person
        </Text>

        {people.map((person) => (
          <View key={person} style={[styles.personCard, isDark && styles.darkSoftRow]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {person.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.personInfo}>
              <Text style={[styles.personName, isDark && styles.darkTitle]}>
                {person}
              </Text>

              <Text style={[styles.personDetail, isDark && styles.darkSubtitle]}>
                Bezahlt: {paidTotals[person].toFixed(2)} {currency}
              </Text>

              <Text style={[styles.personDetail, isDark && styles.darkSubtitle]}>
                Konsumiert: {consumedTotals[person].toFixed(2)} {currency}
              </Text>
            </View>

            <Text style={balances[person] >= 0 ? styles.positive : styles.negative}>
              {balances[person] >= 0 ? "+" : ""}
              {balances[person].toFixed(2)} {currency}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, isDark && styles.darkCard]}>
        <Text style={[styles.cardTitle, isDark && styles.darkTitle]}>
          Wer schuldet wem?
        </Text>

        {settlements.length === 0 ? (
          <View style={[styles.emptyBox, isDark && styles.darkSoftRow]}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={[styles.emptyTitle, isDark && styles.darkTitle]}>
              Alles ausgeglichen
            </Text>
            <Text style={[styles.emptyText, isDark && styles.darkSubtitle]}>
              Es gibt keine offenen Beträge.
            </Text>
          </View>
        ) : (
          settlements.map((settlement, index) => (
            <View key={index} style={[styles.settlementRow, isDark && styles.darkSoftRow]}>
              <View style={styles.arrowCircle}>
                <Text style={styles.arrowText}>→</Text>
              </View>

              <Text style={[styles.settlementText, isDark && styles.darkTitle]}>
                {settlement}
              </Text>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
        <Text style={styles.primaryButtonText}>Zurück zur Gruppe</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.secondaryButton, isDark && styles.darkSecondaryButton]} onPress={() => router.push("/")}>
        <Text style={[styles.secondaryButtonText, isDark && styles.darkSecondaryButtonText]}>
          Zur Startseite
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  darkContainer: {
    backgroundColor: "#0F172A",
  },
  content: {
    padding: 24,
    paddingTop: 58,
    paddingBottom: 40,
  },
  backLink: {
    marginBottom: 14,
  },
  backLinkText: {
    color: "#16A34A",
    fontSize: 15,
    fontWeight: "700",
  },
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
  darkCard: {
    backgroundColor: "#1E293B",
  },
  darkSoftRow: {
    backgroundColor: "#334155",
  },
  pageLabel: {
    color: "#16A34A",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  title: {
    color: "#0F172A",
    fontSize: 34,
    fontWeight: "900",
  },
  darkTitle: {
    color: "#FFFFFF",
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
    marginTop: 8,
  },
  darkSubtitle: {
    color: "#CBD5E1",
  },
  summaryCard: {
    backgroundColor: "#DCFCE7",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
  },
  darkSummaryCard: {
    backgroundColor: "#064E3B",
  },
  summaryLabel: {
    color: "#166534",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 6,
  },
  darkSummaryLabel: {
    color: "#A7F3D0",
  },
  summaryValue: {
    color: "#14532D",
    fontSize: 28,
    fontWeight: "900",
  },
  darkSummaryValue: {
    color: "#FFFFFF",
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
  cardTitle: {
    color: "#0F172A",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 14,
  },
  personCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#16A34A",
    fontSize: 18,
    fontWeight: "900",
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 3,
  },
  personDetail: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 1,
  },
  positive: {
    color: "#16A34A",
    fontSize: 16,
    fontWeight: "900",
  },
  negative: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "900",
  },
  settlementRow: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  arrowCircle: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "#DCFCE7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  arrowText: {
    color: "#16A34A",
    fontSize: 22,
    fontWeight: "900",
  },
  settlementText: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 21,
  },
  emptyBox: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 22,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyTitle: {
    color: "#0F172A",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  emptyText: {
    color: "#64748B",
    textAlign: "center",
  },
  primaryButton: {
    backgroundColor: "#16A34A",
    paddingVertical: 17,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: "#E2E8F0",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 12,
  },
  darkSecondaryButton: {
    backgroundColor: "#334155",
  },
  secondaryButtonText: {
    color: "#334155",
    fontWeight: "900",
    fontSize: 15,
  },
  darkSecondaryButtonText: {
    color: "#FFFFFF",
  },
});