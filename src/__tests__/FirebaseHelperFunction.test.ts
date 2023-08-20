import '@testing-library/jest-dom';
// Polyfill "window.fetch" used in the React component.
import 'whatwg-fetch';
import { FirebaseError } from 'firebase/app';
import {
  getDocs,
  query,
  where,
  collection,
  deleteDoc,
  // DocumentReference,
  // DocumentData,
} from 'firebase/firestore';
import {
  createAuthUserWithEmailAndPassword,
  deleteAuthUser,
  signInAuthUserWithEmailAndPassword,
  signOutUser,
} from '../firebase/firebase.auth';

import {
  createUserDocRefFromAuth,
  createUserDocument,
} from '../firebase/db/users.db';

import { auth, db } from '../firebase/firebase.config';

import { FbEnum, FbCollectionEnum } from '../firebase/firebaseEnum';
import { UserDataOptionalType } from '../firebase/db/database.types';

const emailTest = 'test@gmail.com';
const passTest = 'Drone@123';

const superEmail = 'supertest@mail.com';
const superPassword = 'Always@123@Happy';

/* Life Saver Notes for the future implementation
  const projectId = 'smart-resto-inventory';
  const resetURL = `http://localhost:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`;
  ==> call this in the beforeEach await fetch(resetURL, { method: 'DELETE' });
*/
async function deleteUserCollectionExceptSuper() {
  const collectionRef = collection(db, FbCollectionEnum.users);
  const q = query(collectionRef);
  const querySnapshot = await getDocs(q);

  const promises: Promise<void>[] = [];

  querySnapshot.docs.forEach((doc) => {
    const { email } = doc.data();
    if (email !== 'supertest@mail.com') {
      promises.push(deleteDoc(doc.ref));
    }
  });

  await Promise.all(promises);
}

beforeEach(async () => {
  try {
    await deleteAuthUser(emailTest, passTest);
    await signInAuthUserWithEmailAndPassword(superEmail, superPassword);
    await deleteUserCollectionExceptSuper();
    await signOutUser();
  } catch (err) {
    //
  }
});

async function createAuthUserTest() {
  const userCredential = await createAuthUserWithEmailAndPassword(
    emailTest,
    passTest
  );
  return userCredential;
}

async function signInWithAuthUserTest() {
  const userCredential = await signInAuthUserWithEmailAndPassword(
    emailTest,
    passTest
  );
  return userCredential;
}

async function getDocumentSnapShotTest(email: string) {
  const collectionRef = collection(db, FbCollectionEnum.users);

  const q = query(collectionRef, where('email', '==', email));

  const querySnapShot = await getDocs(q);

  return querySnapShot;
}

describe('Firebase Auth Helper Function', () => {
  test('creates a new user Auth with correct credential', async () => {
    const user = await createAuthUserTest();
    expect(user?.user.email).toBe(emailTest);
  });

  test(`throws errorCode: ${FbEnum.errorAuthEmailInUse} when existing user email is sent`, async () => {
    let errorCode: string = '';
    try {
      await createAuthUserTest();
      await createAuthUserTest();
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        errorCode = err.code;
      } else {
        // eslint-disable-next-line no-console
        console.log(err);
      }
    }
    expect(errorCode).toBe(FbEnum.errorAuthEmailInUse);
  });

  test('returns correct user credential after sign in', async () => {
    await createAuthUserTest();
    const user = await signInAuthUserWithEmailAndPassword(emailTest, passTest);
    expect(user?.user.email).toBe(emailTest);
  });

  test('throws errorCode: "auth/user-not-found" when invalid credential is sent', async () => {
    await createAuthUserTest();
    let errorCode: string = '';
    try {
      await signInAuthUserWithEmailAndPassword('random@gmail.com', passTest);
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        errorCode = err.code;
      } else {
        // eslint-disable-next-line no-console
        console.log(err);
      }
    }
    expect(errorCode).toBe(FbEnum.errorAuthUserNotFound);
  });

  test('returns "null" in auth.currentUser after successful sign out', async () => {
    await createAuthUserTest();
    await signInWithAuthUserTest();
    await signOutUser();
    const user = auth.currentUser;
    expect(user).not.toBeTruthy();
  });

  test('returns null when parameter email or password is empty in createAuthUserWithEmailAndPassword Function ', async () => {
    const user1 = await createAuthUserWithEmailAndPassword('', passTest);
    const user2 = await createAuthUserWithEmailAndPassword(emailTest, '');
    expect(user1).toBe(null);
    expect(user2).toBe(null);
  });

  test('returns null when parameter email or password is empty in signInAuthUserWithEmailAndPassword Function ', async () => {
    const user1 = await signInAuthUserWithEmailAndPassword('', passTest);
    const user2 = await signInAuthUserWithEmailAndPassword(emailTest, '');
    expect(user1).toBe(null);
    expect(user2).toBe(null);
  });
});

describe('Firestore: User Collection Helper Function', () => {
  test('returns a Firestore document reference with correct collection name and userUID', async () => {
    const userCredential = await createAuthUserTest();
    const user = userCredential?.user;

    let error = false;
    if (user) {
      const userDocRef = createUserDocRefFromAuth(user);
      expect(userDocRef.id).toBe(userCredential.user.uid);
      expect(userDocRef.path).toBe(
        `${FbCollectionEnum.users}/${userCredential.user.uid}`
      );
      expect(userDocRef.firestore).toBe(db);
    } else {
      error = true;
    }

    expect(error).toBe(false);
  });

  test('[createUserDocument]returns error "permission-denied" when try to save user to firestore without any authentication', async () => {
    const userCredential = await createAuthUserTest();

    const user = userCredential?.user;

    if (!user) {
      throw new Error('something wrong with creating a new auth user');
    }

    let errorCode: string = '';
    try {
      await createUserDocument(user);
    } catch (err) {
      if (err instanceof FirebaseError) {
        errorCode = err.code;
      }
    }

    expect(errorCode).toBe(FbEnum.errorPermissionDenied);
  });

  test('[createUserDocument]returns error "permission-denied" when try to save user to firestore with normal user credential', async () => {
    const userCredential = await createAuthUserTest();

    const user = userCredential?.user;

    if (!user) {
      throw new Error('something wrong with creating a new auth user');
    }

    let errorCode: string = '';

    await signInAuthUserWithEmailAndPassword(emailTest, passTest);

    try {
      await createUserDocument(user);
    } catch (err) {
      if (err instanceof FirebaseError) {
        errorCode = err.code;
      }
    }

    expect(errorCode).toBe(FbEnum.errorPermissionDenied);
  });

  test('[createUserDocument]saves user data to firestore with Admin User Credential without additional information', async () => {
    const nowInMs = Date.now();
    const userCredential = await createAuthUserTest();
    const user = userCredential?.user;

    if (!user) {
      throw new Error('something wrong with creating a new auth user');
    }

    // Sign In with Super User
    await signInAuthUserWithEmailAndPassword(superEmail, superPassword);

    await createUserDocument(user);

    const querySnapShot = await getDocumentSnapShotTest(emailTest);
    const savedUserData = querySnapShot.docs[0].data();

    expect(savedUserData.email).toBe(emailTest);
    expect(savedUserData.displayName).not.toBeTruthy();
    expect(savedUserData.type).toBe('user');
    expect(Array.isArray(savedUserData.restaurantsIDs)).toBe(true);
    expect(savedUserData.restaurantsIDs.length).toBe(0);
    expect(savedUserData.createdAt.toDate().getTime()).toBeGreaterThan(nowInMs);
    expect(savedUserData.updatedAt.toDate().getTime()).toBeGreaterThan(nowInMs);
  });

  test('[createUserDocument]saves user data to firestore with Admin User Credential with additional information', async () => {
    const nowInMs = Date.now();
    const userCredential = await createAuthUserTest();
    const user = userCredential?.user;

    const inputUserData: UserDataOptionalType = {
      displayName: 'test',
      type: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!user) {
      throw new Error('something wrong with creating a new auth user');
    }

    // Sign In with Super User
    await signInAuthUserWithEmailAndPassword(superEmail, superPassword);

    await createUserDocument(user, inputUserData);

    const querySnapShot = await getDocumentSnapShotTest(emailTest);
    const savedUserData = querySnapShot.docs[0].data();

    expect(savedUserData.email).toBe(emailTest);
    expect(savedUserData.displayName).toBe('test');
    expect(savedUserData.type).toBe('user');
    expect(Array.isArray(savedUserData.restaurantsIDs)).toBe(true);
    expect(savedUserData.restaurantsIDs.length).toBe(0);
    expect(savedUserData.createdAt.toDate().getTime()).toBeGreaterThan(nowInMs);
    expect(savedUserData.updatedAt.toDate().getTime()).toBeGreaterThan(nowInMs);
  });

  // TODO: Only Super User can create users
});
