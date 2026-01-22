// Firebase core
import { initializeApp } from "firebase/app"

// Firestore (database)
import { getFirestore } from "firebase/firestore"

// Authentication (for rejoin support)
import { getAuth, signInAnonymously } from "firebase/auth"

// 🔥 Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC1UFz_HEJNwcKxXM_dLz908lq1I6ACQ78",
  authDomain: "draft-simulation-magic-chess.firebaseapp.com",
  projectId: "draft-simulation-magic-chess",
  storageBucket: "draft-simulation-magic-chess.firebasestorage.app",
  messagingSenderId: "235285862584",
  appId: "1:235285862584:web:ef2a79aa756d006127bc4d"
}

// Initialize Firebase app
const app = initializeApp(firebaseConfig)

// Initialize Firestore
export const db = getFirestore(app)

// Initialize Authentication
export const auth = getAuth(app)

// Sign in anonymously (important for rejoin)
signInAnonymously(auth)
  .then(() => {
    console.log("Firebase anonymous auth connected")
  })
  .catch((error) => {
    console.error("Firebase auth error:", error)
  })
