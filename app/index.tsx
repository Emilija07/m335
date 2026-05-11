import { Redirect } from "expo-router";
import { translation } from "../constants/translation";

const language = "de"; // oder "en"
const t = translation[language];

export default function Index() {
  return <Redirect href="/login" />;
}