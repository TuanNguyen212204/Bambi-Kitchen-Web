// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBcLNn8WXRSuV2AlYUCk6rInMqw2yT3XrA",
  authDomain: "bambi-kitchen.firebaseapp.com",
  projectId: "bambi-kitchen",
  storageBucket: "bambi-kitchen.firebasestorage.app",
  messagingSenderId: "485138845805",
  appId: "1:485138845805:web:643f3ec7c698eef30bef64",
  measurementId: "G-5WQ1D0STLZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const storage = getStorage(app);

export { storage };