import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: "AIzaSyBdAyGgAr6KK44bR9ey6k2Cih4xSVEIneo",
  authDomain: "practice-plan-builder.firebaseapp.com",
  databaseURL: "https://practice-plan-builder-default-rtdb.firebaseio.com",
  projectId: "practice-plan-builder",
  storageBucket: "practice-plan-builder.firebasestorage.app",
  messagingSenderId: "407884514039",
  appId: "1:407884514039:web:bcabedeedd9256930009f2"
}

const app = initializeApp(firebaseConfig)

export const auth     = getAuth(app)
export const db       = getDatabase(app)
export const provider = new GoogleAuthProvider()
