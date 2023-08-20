import {
  doc,
  getDoc,
  setDoc,
  collection,
  DocumentReference,
  DocumentData,
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
