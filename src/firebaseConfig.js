import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, getDocs,
  addDoc, doc, updateDoc, Timestamp,
  query, where, deleteDoc, orderBy // Đảm bảo CÓ deleteDoc
} from "firebase/firestore";
import {
  getAuth, GoogleAuthProvider,
  signInWithPopup, onAuthStateChanged
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA_U6geHzKKbTG8RfvE8ZZASTn-_aFAh6g",
  authDomain: "ban-do-cuu-ho.firebaseapp.com",
  projectId: "ban-do-cuu-ho",
  storageBucket: "ban-do-cuu-ho.firebasestorage.app",
  messagingSenderId: "108809632355",
  appId: "1:108809632355:web:8b20d41762372f6ce91656",
  measurementId: "G-TS2QH1KT4Q"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const incidentsCollection = collection(db, "incidents");

// Lấy các bài CÔNG KHAI (đã duyệt)
const getIncidents = () => {
  const q = query(incidentsCollection,
    where("status", "not-in", ["pending"]),
    orderBy("status"),
    orderBy("time", "desc")
  );
  return getDocs(q);
};

// Lấy TẤT CẢ bài (cho Admin)
const getAllIncidentsForAdmin = () => {
  const q = query(incidentsCollection,
    orderBy("time", "desc")
  );
  return getDocs(q);
};

const addIncident = (data) => addDoc(incidentsCollection, data);
const updateIncident = (id, data) => {
  const incidentRef = doc(db, "incidents", id);
  return updateDoc(incidentRef, data);
};
// HÀM XÓA BÀI
const deleteIncident = (id) => {
  const incidentRef = doc(db, "incidents", id);
  return deleteDoc(incidentRef);
};
const serverTimestamp = () => Timestamp.now();
const handleGoogleLogin = () => signInWithPopup(auth, provider);

export {
  db,
  auth,
  onAuthStateChanged,
  handleGoogleLogin,
  getIncidents,
  getAllIncidentsForAdmin,
  addIncident,
  updateIncident,
  deleteIncident, // ĐÃ EXPORT HÀM XÓA
  serverTimestamp
};