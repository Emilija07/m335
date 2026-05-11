import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAL65hteWyQGNuIR3auYRRS7uHOxfZhcgM",
  authDomain: "qicksplit-9476e.firebaseapp.com",
  projectId: "qicksplit-9476e",
  storageBucket: "qicksplit-9476e.firebasestorage.app",
  messagingSenderId: "754701756663",
  appId: "1:754701756663:web:495855bb0c37ab9b970bf2",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);