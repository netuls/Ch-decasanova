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
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCR9Q64qPoFnCVfP-pk8W2WXOMIqWfb2C4",
  authDomain: "studio-7657884807-a9c5c.firebaseapp.com",
  projectId: "studio-7657884807-a9c5c",
  storageBucket: "studio-7657884807-a9c5c.firebasestorage.app",
  messagingSenderId: "856112416962",
  appId: "1:856112416962:web:be48193adb8dd587c9135b",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

const configDocRef = doc(db, "chaDeCasaNova", "config");
const itemsColRef = collection(db, "chaDeCasaNova", "config", "items");
const contributionsColRef = collection(db, "chaDeCasaNova", "config", "contributions");

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

// Registra uma contribuição feita por um convidado (nome + item + valor).
// Fica salvo na nuvem e aparece na hora no painel admin.
export async function saveContribution({ name, itemName, amount }) {
  await addDoc(contributionsColRef, {
    name,
    itemName,
    amount,
    createdAt: Date.now(),
  });
}

// Escuta em tempo real todas as contribuições registradas, da mais recente
// para a mais antiga — usado no painel admin.
export function subscribeContributions(callback) {
  const q = query(contributionsColRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// Edita uma contribuição já registrada (ex: corrigir nome, item ou valor).
export async function updateContribution(id, changes) {
  const ref = doc(db, "chaDeCasaNova", "config", "contributions", id);
  await updateDoc(ref, changes);
}

// Apaga uma contribuição registrada.
export async function deleteContribution(id) {
  const ref = doc(db, "chaDeCasaNova", "config", "contributions", id);
  await deleteDoc(ref);
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
