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
  QuerySnapshot,
  DocumentData,
  DocumentSnapshot,
} from 'firebase/firestore';
import {
  createAuthUserWithEmailAndPassword,
  deleteAuthUser,
  signInAuthUserWithEmailAndPassword,
  signOutUser,
} from '../service/firebase/firebase.auth';

import {
  createUserDocRefFromAuth,
  createUserDocument,
  getAllUsers,
  getUser,
  updateUserDocument,
  addUserRestaurantsIDs,
  removeUserRestaurantsIDs,
} from '../service/firebase/db/users.db';

import { auth, db } from '../service/firebase/firebase.config';

import { FbEnum, FbCollectionEnum } from '../service/utils/enums/firebaseEnum';
import {
  UserDataOptionalType,
  UserDataRestaurantsIdsOnly,
} from '../service/firebase/db/database.types';

import { ErrorUserUpdateWithRestaurantIDs } from '../service/utils/Errors/ErrorClass';

const emailTest = 'test@gmail.com';
const passTest = 'Drone@123';

const superEmail = 'supertest@mail.com';
const superPassword = 'Always@123@Happy';

const testEmailArray = ['test@gmail.com', 'supertest@mail.com'];

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

async function createAuthUserTest(email = emailTest, password = passTest) {
  const userCredential = await createAuthUserWithEmailAndPassword(
    email,
    password
  );
  return userCredential;
}

async function signInWithAuthUserTest(email = emailTest, password = passTest) {
  const userCredential = await signInAuthUserWithEmailAndPassword(
    email,
    password
  );
  return userCredential;
}

async function getDocumentSnapShotTest(email: string) {
  const collectionRef = collection(db, FbCollectionEnum.users);

  const q = query(collectionRef, where('email', '==', email));

  const querySnapShot = await getDocs(q);

  return querySnapShot;
}

async function createUserCollectionFromAuthTest(
  inputUserData: UserDataOptionalType = {}
) {
  const userCredential = await createAuthUserTest();
  const user = userCredential?.user;

  if (!user) {
    throw new Error('something wrong with creating a new auth user');
  }

  // Sign In with Super User
  await signInAuthUserWithEmailAndPassword(superEmail, superPassword);

  await createUserDocument(user, inputUserData);

  return user;
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

  describe('[Create User Document] Function', () => {
    test('returns error "permission-denied" when try to save user to firestore without any authentication', async () => {
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

    test('returns error "permission-denied" when try to save user to firestore with normal user credential', async () => {
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

    test('[saves user data to firestore with Admin User Credential without additional information', async () => {
      const nowInMs = Date.now();
      await createUserCollectionFromAuthTest();

      const querySnapShot = await getDocumentSnapShotTest(emailTest);
      const savedUserData = querySnapShot.docs[0].data();

      expect(savedUserData.email).toBe(emailTest);
      expect(savedUserData.displayName).not.toBeTruthy();
      expect(savedUserData.type).toBe('user');
      expect(Array.isArray(savedUserData.restaurantsIDs)).toBe(true);
      expect(savedUserData.restaurantsIDs.length).toBe(0);
      expect(savedUserData.createdAt.toDate().getTime()).toBeGreaterThan(
        nowInMs
      );
      expect(savedUserData.updatedAt.toDate().getTime()).toBeGreaterThan(
        nowInMs
      );
    });

    test('saves user data to firestore with Admin User Credential with additional information', async () => {
      const nowInMs = Date.now();

      const inputUserData: UserDataOptionalType = {
        displayName: 'test',
        type: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await createUserCollectionFromAuthTest(inputUserData);

      const querySnapShot = await getDocumentSnapShotTest(emailTest);
      const savedUserData = querySnapShot.docs[0].data();

      expect(savedUserData.email).toBe(emailTest);
      expect(savedUserData.displayName).toBe('test');
      expect(savedUserData.type).toBe('user');
      expect(Array.isArray(savedUserData.restaurantsIDs)).toBe(true);
      expect(savedUserData.restaurantsIDs.length).toBe(0);
      expect(savedUserData.createdAt.toDate().getTime()).toBeGreaterThanOrEqual(
        nowInMs
      );
      expect(savedUserData.updatedAt.toDate().getTime()).toBeGreaterThanOrEqual(
        nowInMs
      );
    });
  });

  describe('[getAllUsers] function', () => {
    test('returns error "permission-denied" when try to get all users without any authentication', async () => {
      await createUserCollectionFromAuthTest();
      await signOutUser();
      let errorCode = '';
      try {
        await getAllUsers();
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }
      expect(errorCode).toBe(FbEnum.errorPermissionDenied);
    });

    test('returns error "permission-denied" when try to get all users when login with normal user authentication', async () => {
      await createUserCollectionFromAuthTest();
      await signOutUser();
      await signInWithAuthUserTest(emailTest, passTest);
      let errorCode = '';
      try {
        await getAllUsers();
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }

      expect(errorCode).toBe(FbEnum.errorPermissionDenied);
    });

    test('returns all Users when try to get all users when login with admin user authentication', async () => {
      await createUserCollectionFromAuthTest();
      let querySnapShot: QuerySnapshot<DocumentData, DocumentData> | null =
        null;
      let errorCode = '';
      try {
        querySnapShot = await getAllUsers();
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }

      if (!querySnapShot) {
        throw new Error('something wrong with the firestore query');
      }

      const emailArrayResponse: string[] = [];
      querySnapShot.docs.forEach((data) => {
        const { email } = data.data();
        emailArrayResponse.push(email);
      });

      expect(querySnapShot.docs.length).toBe(2);
      expect(errorCode).toBeFalsy();
      expect(emailArrayResponse.sort()).toEqual(testEmailArray.sort());
    });
  });

  describe('[getUser] function', () => {
    test('returns error "permission-denied" when try to get a specific user document without any authentication', async () => {
      const newUser = await createUserCollectionFromAuthTest();
      await signOutUser();
      let errorCode = '';
      try {
        await getUser(newUser.uid);
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }
      expect(errorCode).toBe(FbEnum.errorPermissionDenied);
    });

    test('returns error "permission-denied" when try to get other user document when login with normal user authentication', async () => {
      await createUserCollectionFromAuthTest();
      const superUser = await signOutUser();
      await signInAuthUserWithEmailAndPassword(emailTest, passTest);
      let errorCode = '';
      if (!superUser) {
        throw new Error('Something wrong with the sign out user function');
      }
      try {
        await getUser(superUser);
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }
      expect(errorCode).toBe(FbEnum.errorPermissionDenied);
    });

    test('returns user document when try to get other its own user document data when login with normal user authentication', async () => {
      const nowInMs = Date.now();
      const newUser = await createUserCollectionFromAuthTest();
      await signOutUser();
      await signInAuthUserWithEmailAndPassword(emailTest, passTest);
      let errorCode = '';
      let docSnap: DocumentSnapshot<DocumentData, DocumentData> | null = null;

      try {
        docSnap = await getUser(newUser.uid);
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }
      const document = docSnap?.data();
      const email = document?.email;
      const createdAt = document?.createdAt.toDate().getTime();
      const updatedAt = document?.updatedAt.toDate().getTime();
      const type = document?.type;
      expect(errorCode).toBeFalsy();
      expect(email).toBe(emailTest);
      expect(type).toBe('user');
      expect(createdAt).toBeGreaterThanOrEqual(nowInMs);
      expect(updatedAt).toBeGreaterThanOrEqual(nowInMs);
    });

    test('returns user document when try to get other other user document data when login with admin user authentication', async () => {
      const nowInMs = Date.now();
      const newUser = await createUserCollectionFromAuthTest();
      await signOutUser();
      await signInAuthUserWithEmailAndPassword(superEmail, superPassword);
      let errorCode = '';
      let docSnap: DocumentSnapshot<DocumentData, DocumentData> | null = null;

      try {
        docSnap = await getUser(newUser.uid);
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }
      const document = docSnap?.data();
      const email = document?.email;
      const createdAt = document?.createdAt.toDate().getTime();
      const updatedAt = document?.updatedAt.toDate().getTime();
      const type = document?.type;
      expect(errorCode).toBeFalsy();
      expect(email).toBe(emailTest);
      expect(type).toBe('user');
      expect(createdAt).toBeGreaterThanOrEqual(nowInMs);
      expect(updatedAt).toBeGreaterThanOrEqual(nowInMs);
    });
  });

  describe('[updateUserDocument] function', () => {
    test('returns error "permission-denied" when try to modify user document without any authentication', async () => {
      const newUser = await createUserCollectionFromAuthTest();
      await signOutUser();
      let errorCode = '';

      const inputUserData: UserDataOptionalType = {
        displayName: 'updated-test',
      };

      try {
        await updateUserDocument(newUser.uid, inputUserData);
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }

      expect(errorCode).toBe(FbEnum.errorPermissionDenied);
    });

    test('returns error "permission-denied" when try to modify other user document when login with normal user authentication', async () => {
      await createUserCollectionFromAuthTest();
      const superUserUID = await signOutUser();
      await signInAuthUserWithEmailAndPassword(emailTest, passTest);

      if (!superUserUID) {
        throw new Error('Something wrong with the signOut');
      }

      let errorCode = '';

      const inputUserData: UserDataOptionalType = {
        displayName: 'updated-test',
      };

      try {
        await updateUserDocument(superUserUID, inputUserData);
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }

      expect(errorCode).toBe(FbEnum.errorPermissionDenied);
    });

    test('returns error "permission-denied" when try to modify its own user document when login with normal user authentication', async () => {
      const newUser = await createUserCollectionFromAuthTest();
      await signOutUser();
      await signInAuthUserWithEmailAndPassword(emailTest, passTest);

      let errorCode = '';

      const inputUserData: UserDataOptionalType = {
        displayName: 'updated-test',
      };

      try {
        await updateUserDocument(newUser.uid, inputUserData);
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }

      expect(errorCode).toBe(FbEnum.errorPermissionDenied);
    });

    test('updates user document with only the field that submitted (not overwritten the doc) when login with admin user authentication', async () => {
      const newUser = await createUserCollectionFromAuthTest();

      const querySnapShotBefore = await getDocumentSnapShotTest(emailTest);
      const savedUserDataBefore = querySnapShotBefore.docs[0].data();

      const {
        email: emailBefore,
        type: typeBefore,
        restaurantsIDs: restaurantsIDsBefore,
        createdAt: createdAtBefore,
        updatedAt: updatedAtBefore,
      } = savedUserDataBefore;

      let errorCode = '';

      const inputUserData: UserDataOptionalType = {
        displayName: 'updated-test',
      };

      try {
        await updateUserDocument(newUser.uid, inputUserData);
      } catch (err) {
        if (err instanceof FirebaseError) {
          errorCode = err.code;
        }
      }

      const querySnapShot = await getDocumentSnapShotTest(emailTest);
      const savedUserData = querySnapShot.docs[0].data();
      const { email, type, restaurantsIDs, createdAt, updatedAt, displayName } =
        savedUserData;

      expect(errorCode).toBeFalsy();
      // checking the previous data that should not be changed
      expect(email).toBe(emailBefore);
      expect(type).toBe(typeBefore);
      expect(Array.isArray(restaurantsIDs)).toBe(true);
      expect(restaurantsIDs.length).toBe(restaurantsIDsBefore.length);
      expect(createdAt.toDate().getTime()).toBe(
        createdAtBefore.toDate().getTime()
      );

      // checking the new updated data
      expect(displayName).toBe('updated-test');
      expect(updatedAt.toDate().getTime()).toBeGreaterThan(
        updatedAtBefore.toDate().getTime()
      );
    });

    test(`returns error "${FbEnum.errorUserUpdateWithRestaurantIDs}" and no change when try to update the restaurantIDs field when login with admin user authentication`, async () => {
      const newUser = await createUserCollectionFromAuthTest();

      const querySnapShotBefore = await getDocumentSnapShotTest(emailTest);
      const savedUserDataBefore = querySnapShotBefore.docs[0].data();

      const { restaurantsIDs: restaurantsIDsBefore } = savedUserDataBefore;

      let errorCode = '';

      const inputUserData: UserDataOptionalType = {
        restaurantsIDs: ['restaurantID1', 'restaurantID2'],
      };

      try {
        await updateUserDocument(newUser.uid, inputUserData);
      } catch (err) {
        if (err instanceof ErrorUserUpdateWithRestaurantIDs) {
          errorCode = err.code;
        }
      }

      const querySnapShot = await getDocumentSnapShotTest(emailTest);
      const savedUserData = querySnapShot.docs[0].data();
      const { restaurantsIDs } = savedUserData;

      expect(errorCode).toBe(FbEnum.errorUserUpdateWithRestaurantIDs);
      // checking the previous data that should not be changed
      expect(Array.isArray(restaurantsIDs)).toBe(true);
      expect(restaurantsIDs.length).toBe(restaurantsIDsBefore.length);
      expect(JSON.stringify(restaurantsIDs.sort())).toBe(
        JSON.stringify(restaurantsIDsBefore.sort())
      );
    });
  });

  describe('[addUserRestaurantsIDs] and [removeUserRestaurantsIDs] function', () => {
    test(`adds elements in restaurantsIDs array when try to update the restaurantIDs field when login with admin user authentication`, async () => {
      const newUser = await createUserCollectionFromAuthTest();

      let errorCode = '';

      const restaurantsIDs = ['restaurantID1', 'restaurantID2'];

      const inputUserData: UserDataRestaurantsIdsOnly = {
        restaurantsIDs,
      };

      try {
        await addUserRestaurantsIDs(newUser.uid, inputUserData);
      } catch (err) {
        if (err instanceof ErrorUserUpdateWithRestaurantIDs) {
          errorCode = err.code;
        }
      }

      const querySnapShot = await getDocumentSnapShotTest(emailTest);
      const savedUserData = querySnapShot.docs[0].data();
      const { restaurantsIDs: restaurantsIDsResponse } = savedUserData;

      expect(errorCode).toBeFalsy();
      expect(Array.isArray(restaurantsIDs)).toBe(true);
      expect(restaurantsIDsResponse.length).toBe(2);
      expect(JSON.stringify(restaurantsIDsResponse.sort())).toBe(
        JSON.stringify(restaurantsIDs.sort())
      );
    });

    test(`removes elements in restaurantsIDs array when try to update the restaurantIDs field when login with admin user authentication`, async () => {
      const newUser = await createUserCollectionFromAuthTest({
        restaurantsIDs: ['restaurantID1', 'restaurantID2', 'restaurantsID3'],
      });

      let errorCode = '';

      const restaurantsIDs = ['restaurantID1', 'restaurantID2'];

      const inputUserData: UserDataRestaurantsIdsOnly = {
        restaurantsIDs,
      };

      try {
        await removeUserRestaurantsIDs(newUser.uid, inputUserData);
      } catch (err) {
        if (err instanceof ErrorUserUpdateWithRestaurantIDs) {
          errorCode = err.code;
        }
      }

      const querySnapShot = await getDocumentSnapShotTest(emailTest);
      const savedUserData = querySnapShot.docs[0].data();
      const { restaurantsIDs: restaurantsIDsResponse } = savedUserData;

      expect(errorCode).toBeFalsy();
      expect(Array.isArray(restaurantsIDs)).toBe(true);
      expect(restaurantsIDsResponse.length).toBe(1);
      expect(JSON.stringify(restaurantsIDsResponse.sort())).toBe(
        JSON.stringify(['restaurantsID3'])
      );
    });
  });
});
