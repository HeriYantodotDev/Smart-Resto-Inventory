/* eslint-disable import/no-extraneous-dependencies */
import { initializeApp, FirebaseOptions } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyDsmk6T0WJZnDRUnBSHNJ7wWZr5McbIGjw',
  authDomain: 'smart-resto-inventory.firebaseapp.com',
  projectId: 'smart-resto-inventory',
  storageBucket: 'smart-resto-inventory.appspot.com',
  messagingSenderId: '870841543868',
  appId: '1:870841543868:web:94df64b634667d728e74b9',
  measurementId: 'G-D34CBDNM1C',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

if (window.location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
