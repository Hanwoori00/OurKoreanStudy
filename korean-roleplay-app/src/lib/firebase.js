import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCHEy8Xq2iDUzTQyTbLs1gHSRdhWRDEG6E",
  authDomain: "koreanstudy-af2de.firebaseapp.com",
  projectId: "koreanstudy-af2de",
  storageBucket: "koreanstudy-af2de.firebasestorage.app",
  messagingSenderId: "444823730404",
  appId: "1:444823730404:web:491d43d740d2f2a411d4f1"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
