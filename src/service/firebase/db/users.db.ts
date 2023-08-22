import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  collection,
  DocumentReference,
  DocumentData,
  query,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from 'firebase/firestore';

import { User } from 'firebase/auth';
import { db } from '../firebase.config';
import {
  UserDataType,
  UserDataOptionalType,
  UserDataRestaurantsIdsOnly,
} from './database.types';

import {
  FbCollectionEnum,
  FbUserTypeEnum,
} from '../../utils/enums/firebaseEnum';

import { ErrorUserUpdateWithRestaurantIDs } from '../../utils/Errors/ErrorClass';

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

export async function getUserSnapShot(userUID: string) {
  const userDocRef = createUserDocRefFromUserUID(userUID);
  const docSnapShot = getDoc(userDocRef);
  return docSnapShot;
}

export async function getUserDocument(userUID: string) {
  const userDocSnapShot = await getUserSnapShot(userUID);
  const userDocument = userDocSnapShot.data();
  return userDocument;
}

export async function getAllUsersSnapShot() {
  const collectionRef = collection(db, FbCollectionEnum.users);
  const q = query(collectionRef);
  const querySnapShot = await getDocs(q);
  return querySnapShot;
}

export async function getAllUsersDocument() {
  const querySnapShot = await getAllUsersSnapShot();
  const allUserDocuments = querySnapShot.docs.map((data) => {
    return data.data();
  });
  return allUserDocuments;
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
  const restaurantsIDs: string[] = [];
  const createdAt = serverTimestamp();
  const updatedAt = serverTimestamp();
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
  if ('restaurantsIDs' in userInput) {
    throw new ErrorUserUpdateWithRestaurantIDs();
  }

  const userDocRef = createUserDocRefFromUserUID(userUID);

  const userInputWithUpdatedAt = {
    ...userInput,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(userDocRef, userInputWithUpdatedAt);
}

export async function addUserRestaurantsIDs(
  userUID: string,
  userInput: UserDataRestaurantsIdsOnly
) {
  const userDocRef = createUserDocRefFromUserUID(userUID);

  const { restaurantsIDs } = userInput;

  const userInputWithUpdatedAt = {
    restaurantsIDs: arrayUnion(...restaurantsIDs),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(userDocRef, userInputWithUpdatedAt);
}

export async function removeUserRestaurantsIDs(
  userUID: string,
  userInput: UserDataRestaurantsIdsOnly
) {
  const userDocRef = createUserDocRefFromUserUID(userUID);

  const { restaurantsIDs } = userInput;

  const userInputWithUpdatedAt = {
    restaurantsIDs: arrayRemove(...restaurantsIDs),
    updatedAt: serverTimestamp(),
  };

  await updateDoc(userDocRef, userInputWithUpdatedAt);
}

export async function deleteUserDocument(userUID: string) {
  const userDocRef = createUserDocRefFromUserUID(userUID);
  await deleteDoc(userDocRef);
}
