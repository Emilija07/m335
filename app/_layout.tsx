import {
<<<<<<< HEAD
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
=======
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
>>>>>>> 28be084ed22dc52656e8af412d579c2dd81d48f0
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
<<<<<<< HEAD

import { useColorScheme } from "@/hooks/use-color-scheme";

=======
 
import { useColorScheme } from "@/hooks/use-color-scheme";
 
>>>>>>> 28be084ed22dc52656e8af412d579c2dd81d48f0
export const unstable_settings = {
  anchor: "(tabs)",
};
 
export default function RootLayout() {
  const colorScheme = useColorScheme();
 
  return (
<<<<<<< HEAD
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
=======
<ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
<Stack>
<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
</Stack>
<StatusBar style="auto" />
</ThemeProvider>
>>>>>>> 28be084ed22dc52656e8af412d579c2dd81d48f0
  );
}