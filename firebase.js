// ════════════════════════════════════════════════════════════════════
// CONFIGURATION FIREBASE - Connexion à la base de données cloud
// ════════════════════════════════════════════════════════════════════
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBej2pzMwpqZODrTE0t1AkM4mnn_guQPZE",
  authDomain: "locatzy-ab8fd.firebaseapp.com",
  projectId: "locatzy-ab8fd",
  storageBucket: "locatzy-ab8fd.firebasestorage.app",
  messagingSenderId: "496184657296",
  appId: "1:496184657296:web:3825c7cb00a70cca17df15",
  measurementId: "G-96E0C3RHCS",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Helpers Firestore réutilisables
export {
  collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, setDoc, getDocs,
};
