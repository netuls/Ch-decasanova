/* ==========================================================================
   firebase-config.js
   Conexão com o Firebase Firestore — banco de dados na nuvem.
   Tudo que é salvo aqui aparece automaticamente para qualquer visitante,
   em qualquer aparelho (PC, Android, iOS), sem precisar mexer no GitHub.
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  collection,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-pWCZqu_wqghj65pix_kOIh_BkuNaOOM",
  authDomain: "banco-cw.firebaseapp.com",
  databaseURL: "https://banco-cw-default-rtdb.firebaseio.com",
  projectId: "banco-cw",
  storageBucket: "banco-cw.firebasestorage.app",
  messagingSenderId: "1005772037818",
  appId: "1:1005772037818:web:16a25547fc336c5b45ac83",
  measurementId: "G-11R6LQ18ST",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const configDocRef = doc(db, "chaDeCasaNova", "config");
const itemsColRef = collection(db, "chaDeCasaNova", "config", "items");

export async function fetchRemoteConfig() {
  const snap = await getDoc(configDocRef);
  return snap.exists() ? snap.data() : null;
}

export async function fetchRemoteItems() {
  const snap = await getDocs(itemsColRef);
  const items = [];
  snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
  return items;
}

export function subscribeConfig(callback) {
  return onSnapshot(configDocRef, (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export function subscribeItems(callback) {
  return onSnapshot(itemsColRef, (snap) => {
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    callback(items);
  });
}

export async function saveRemoteConfig(config) {
  await setDoc(configDocRef, config, { merge: true });
}

export async function saveRemoteItems(items) {
  const batch = writeBatch(db);
  items.forEach((item) => {
    const { id, ...rest } = item;
    const ref = doc(db, "chaDeCasaNova", "config", "items", id);
    batch.set(ref, rest, { merge: true });
  });
  await batch.commit();
}

// Na primeira vez que o site roda, se o banco ainda estiver vazio,
// preenche com os valores padrão de data.js.
export async function seedIfEmpty(defaultConfig, defaultItems) {
  const cfgSnap = await getDoc(configDocRef);
  if (!cfgSnap.exists()) {
    await setDoc(configDocRef, defaultConfig);
  }
  const itemsSnap = await getDocs(itemsColRef);
  if (itemsSnap.empty) {
    const batch = writeBatch(db);
    defaultItems.forEach((item) => {
      const { id, ...rest } = item;
      batch.set(doc(db, "chaDeCasaNova", "config", "items", id), rest);
    });
    await batch.commit();
  }
}
