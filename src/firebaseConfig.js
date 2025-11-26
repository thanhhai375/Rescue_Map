import { initializeApp } from "firebase/app";
import {
  getFirestore, collection, getDocs,
  addDoc, doc, updateDoc, Timestamp,
  query, where, deleteDoc, orderBy
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

// --- HÀM LẤY DỮ LIỆU CÓ LỌC THỜI GIAN ---
// hoursFilter có thể là số (48) hoặc chuỗi 'all'
const getIncidents = (hoursFilter = 48) => {

  // 1. Nếu chọn 'all', lấy hết (chỉ lọc bài đã duyệt)
  if (hoursFilter === 'all') {
    const q = query(incidentsCollection,
      where("status", "not-in", ["pending"]),
      orderBy("status"), // Sắp xếp status trước để thỏa mãn composite index
      orderBy("time", "desc")
    );
    return getDocs(q);
  }

  // 2. Nếu chọn giờ cụ thể, thêm điều kiện thời gian
  const timeThreshold = Timestamp.fromMillis(Date.now() - hoursFilter * 3600 * 1000);

  const q = query(incidentsCollection,
    where("status", "not-in", ["pending"]),
    where("time", ">=", timeThreshold),
    orderBy("time", "desc")
  );
  return getDocs(q);
};
// ----------------------------------------

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
  deleteIncident,
  serverTimestamp
};