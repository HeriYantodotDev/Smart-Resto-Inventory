import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  DocumentReference,
  DocumentData,
  query,
} from 'firebase/firestore';

import { User } from 'firebase/auth';
import { db } from '../firebase.config';
import { UserDataType, UserDataOptionalType } from './database.types';

import { FbCollectionEnum, FbUserTypeEnum } from '../firebaseEnum';

export function createUserDocRefFromAuth(user: User) {
  const userUID = user.uid;
  const userCollectionRef = collection(db, FbCollectionEnum.users);
  const userDocRef = doc(userCollectionRef, userUID);
  return userDocRef;
}

export function createUserDocRefFromUserUID(userUID: string) {
  const userCollectionRef = collection(db, FbCollectionEnum.users);
  const userDocRef = doc(userCollectionRef, userUID);
  return userDocRef;
}

export async function getUser(userUID: string) {
  const userDocRef = createUserDocRefFromUserUID(userUID);
  const docSnap = getDoc(userDocRef);
  return docSnap;
}

export async function getAllUsers() {
  const collectionRef = collection(db, FbCollectionEnum.users);
  const q = query(collectionRef);
  const querySnapShot = await getDocs(q);
  return querySnapShot;
}

export async function userSnapshotExists(
  userDocRef: DocumentReference<DocumentData, DocumentData>
) {
  return (await getDoc(userDocRef)).exists();
}

function generateUserInput(
  user: User,
  userDataOptional: UserDataOptionalType
): UserDataType {
  const displayName = user.displayName || '';
  const email = user.email || '';
  const restaurantsIDs: number[] = [];
  const createdAt = new Date();
  const updatedAt = new Date();
  const type = FbUserTypeEnum.user;

  const userInput: UserDataType = {
    displayName,
    email,
    createdAt,
    updatedAt,
    restaurantsIDs,
    type,
    ...userDataOptional,
  };

  return userInput;
}

export async function createUserDocument(
  user: User,
  userDataOptional: UserDataOptionalType = {}
) {
  const userDocRef = createUserDocRefFromAuth(user);

  const userExists = await userSnapshotExists(userDocRef);

  if (!userExists) {
    const userInput = generateUserInput(user, userDataOptional);
    await setDoc(userDocRef, userInput);
  }
}

export async function updateUserDocument(
  userUID: string,
  userInput: UserDataOptionalType
) {
  const userDocRef = createUserDocRefFromUserUID(userUID);

  const userInputWithUpdatedAt: UserDataOptionalType = {
    ...userInput,
    updatedAt: new Date(),
  };

  await setDoc(userDocRef, userInputWithUpdatedAt, { merge: true });
}
