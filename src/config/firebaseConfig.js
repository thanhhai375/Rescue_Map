import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, getDocs,
  addDoc, doc, updateDoc, Timestamp,
  query, where, deleteDoc, orderBy, limit, writeBatch
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

const checkLinkExists = async (link) => {
  if (!link) return false;
  const q = query(incidentsCollection, where("sourceLink", "==", link), limit(1));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

const deleteOldIncidents = async () => {
  try {
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const threshold = Timestamp.fromDate(twoDaysAgo);

    const q = query(incidentsCollection, where("time", "<", threshold));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`[Auto-Clean] Đã xóa ${snapshot.size} tin cũ hơn 2 ngày.`);
  } catch (error) {
    console.error("Lỗi xóa tin cũ:", error);
  }
};

const getIncidents = (hoursFilter = 48) => {
  if (hoursFilter === 'all') {
    const q = query(incidentsCollection,
      where("status", "not-in", ["pending"]),
      orderBy("status"),
      orderBy("time", "desc")
    );
    return getDocs(q);
  }
  const timeThreshold = Timestamp.fromMillis(Date.now() - hoursFilter * 3600 * 1000);
  const q = query(incidentsCollection,
    where("status", "not-in", ["pending"]),
    where("time", ">=", timeThreshold),
    orderBy("time", "desc")
  );
  return getDocs(q);
};

const getAllIncidentsForAdmin = () => {
  const q = query(incidentsCollection, orderBy("time", "desc"));
  return getDocs(q);
};

const addIncident = (data) => addDoc(incidentsCollection, data);

const updateIncident = (id, data) => {
  const incidentRef = doc(db, "incidents", id);
  return updateDoc(incidentRef, data);
};

const deleteIncident = (id) => {
  const incidentRef = doc(db, "incidents", id);
  return deleteDoc(incidentRef);
};

const serverTimestamp = () => Timestamp.now();
const handleGoogleLogin = () => signInWithPopup(auth, provider);

export {
  db, auth, onAuthStateChanged, handleGoogleLogin,
  getIncidents, getAllIncidentsForAdmin, addIncident,
  updateIncident, deleteIncident, serverTimestamp,
  checkLinkExists, deleteOldIncidents
};