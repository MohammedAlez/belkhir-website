// استيراد الوظائف المطلوبة من Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// تكوين Firebase باستخدام بيانات مشروعك
const firebaseConfig = {
  apiKey: "AIzaSyADqh2msylzzyZwjRfmC0KGqkKPof454RM",
  authDomain: "site-a0ff3.firebaseapp.com",
  projectId: "site-a0ff3",
  storageBucket: "site-a0ff3.firebasestorage.app",
  messagingSenderId: "15533906134",
  appId: "1:15533906134:web:4136fe0ca9475a2ddb1177",
  measurementId: "G-QL6EXB22QG"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// تهيئة خدمات Firebase
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
