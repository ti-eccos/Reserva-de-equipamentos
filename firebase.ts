import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCXVPPf37kIpB9YiL9pqaGAgddXdyXSiyk",
  authDomain: "reserva-de-equipamentos-aec57.firebaseapp.com",
  projectId: "reserva-de-equipamentos-aec57",
  storageBucket: "reserva-de-equipamentos-aec57.firebasestorage.com", // Fixed domain
  messagingSenderId: "1006534745772",
  appId: "1:1006534745772:web:3fbd5857b49fe1d2268909"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
