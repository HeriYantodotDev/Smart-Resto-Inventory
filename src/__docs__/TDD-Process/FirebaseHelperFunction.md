# Firebase Helper Function

> Before We start we have to start the emulator : `firebase emulators:start`

- Dependencies.
  Let's start with installing the dependencies first:

  ```
  npm install firebase
  ```

- Set up the config
  Create a config file `firebase.config.ts` withing the folder `firebase`:

  ```ts
  /* eslint-disable import/no-extraneous-dependencies */
  import { initializeApp, FirebaseOptions } from 'firebase/app';
  import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
  import { getAuth, connectAuthEmulator } from 'firebase/auth';

  const firebaseConfig: FirebaseOptions = {
    apiKey: '.',
    authDomain: '.',
    projectId: '.',
    storageBucket: '.',
    messagingSenderId: '.',
    appId: '.',
    measurementId: '.',
  };

  export const firebaseApp = initializeApp(firebaseConfig);
  export const db = getFirestore(firebaseApp);
  export const auth = getAuth(firebaseApp);

  if (window.location.hostname === 'localhost') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099');
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
  }
  ```

# Authentication Helper Function

- Create the first test

  In this test we're using the helper function from `firebase.auth.ts` to test related with the firebase authentication. Before each test we will delete the user.
  Then we test for create a new auth user and also sign in. We don't have to mock the firebase since we're using local emulator, so everything will work as expected.

  > Remember that we have to polyfill the fetch implementation using `whatwg-fetch`

  ```tsx
  /* eslint-disable import/no-extraneous-dependencies */
  import '@testing-library/jest-dom';
  // Polyfill "window.fetch" used in the React component.
  import 'whatwg-fetch';
  import {
    createAuthUserWithEmailAndPassword,
    deleteAuthUser,
    signInAuthUserWithEmailAndPassword,
  } from '../firebase/firebase.auth';

  const emailTest = 'test@gmail.com';
  const passTest = 'Drone@123';

  beforeEach(async () => {
    try {
      await deleteAuthUser(emailTest, passTest);
    } catch (err) {
      //
    }
  });

  describe('Firebase Helper Function For User Creation', () => {
    test('creates a new user Auth with correct credential', async () => {
      const user = await createAuthUserWithEmailAndPassword(emailTest, passTest);
      expect(user?.user.email).toBe(emailTest);
    });

    test('returns correct user credential after sign in', async () => {
      await createAuthUserWithEmailAndPassword(emailTest, passTest);
      const user = await signInAuthUserWithEmailAndPassword(emailTest, passTest);
      expect(user?.user.email).toBe(emailTest);
    });
  });

  ```

- Implementation
  Here's the implementation in the `firebase.auth.ts`:
  The implementation is a straight forward implementation without checking if it throws an error. I think I will use as it is, and checking for the error in the next implementation.
  This means every function for helper function in the firebase should be used with a try catch block.

  ```tsx
  import {
    createUserWithEmailAndPassword,
    deleteUser,
    signInWithEmailAndPassword,
  } from 'firebase/auth';
  import { auth } from './firebase.config';

  export async function createAuthUserWithEmailAndPassword(
    email: string,
    password: string
  ) {
    if (!email || !password) return null;
    const newUser = await createUserWithEmailAndPassword(auth, email, password);
    return newUser;
  }

  export async function signInAuthUserWithEmailAndPassword(
    email: string,
    password: string
  ) {
    if (!email || !password) return null;
    const user = await signInWithEmailAndPassword(auth, email, password);
    return user;
  }

  // Mostly for test purposes
  export async function deleteAuthUser(email: string, password: string) {
    await signInAuthUserWithEmailAndPassword(email, password);
    const user = auth.currentUser;
    if (user) {
      await deleteUser(user);
    }
  }
  ```

Great now let's add several test for checking the error. We don't have to do this though, however, I'd like to test the Firebase Error and also the enum that we've just created.

In the belows test we import `import { FirebaseError } from 'firebase/app';` to get the type of the Firebase Error. We check whether the error is the instance of Firebase Error, then assign the error code to be check.

```tsx
test(`throws errorCode: ${FbEnum.errorAuthEmailInUse} when existing user email is sent`, async () => {
  let errorCode: string = '';
  try {
    await createAuthUserWithEmailAndPassword(emailTest, passTest);
    await createAuthUserWithEmailAndPassword(emailTest, passTest);
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

test('throws errorCode: "auth/user-not-found" when invalid credential is sent', async () => {
  await createAuthUserWithEmailAndPassword(emailTest, passTest);
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
```

For the implementation we just need to create an enum file named `firebaseEnum.ts` :

```tsx
enum FbEnum {
  errorAuthUserNotFound = 'auth/user-not-found',
  errorAuthEmailInUse = 'auth/email-already-in-use',
}

export default FbEnum;
```

> Remember we don't have to test the libraries. However in the case above we will use the enums later in our next implementation.

> Here's the full list of [Auth Error](https://firebase.google.com/docs/auth/admin/errors)

Great now let's add a functionality for sign out:

```tsx
test('sign out test', async () => {
  await createAuthUserWithEmailAndPassword(emailTest, passTest);
  await signInAuthUserWithEmailAndPassword(emailTest, passTest);
  await signOutUser();
  const user = auth.currentUser;
  expect(user).not.toBeTruthy();
});
```

The implementation is very simple though:

```tsx
export async function signOutUser() {
  await signOut(auth);
}
```

> In the real implementation, we'd like the browser to refresh after signOut, but we'd figure it out later.

Before moving from auth part, let's test the previous function to return null when the parameter is empty. This is to ensure 100% coverage, however please bear in mind 100% test coverage doesn't mean the test is good and covers all the necessary test case.

```tsx
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
```

> In fact if the parameter is empty firebase will throw an error, however this is to ensure predictable result in our function.

# Firestore: User Collection: Helper Function

Before we create a React component for creating a user, let's add several helper function for User Collection.

## User Document Reference

Let's start with the first test. In this test, we will add a new helper function to return the user document references. We will check if the return value of this helper function named `getUserDocRefFromAuth` contains the correct:

- Collection name, in this case 'users'
- Correct path: 'users/..<user.uid>'
- Correct Firestore

Of course, the checking can only be executed if we get back the user after creating a new user. Therefore if user is null we set error to true, and we don't have to check the user document reference. The test will fail if the user is null.

```tsx
describe('Firestore: User Collection Helper Function', () => {
  test('returns a Firestore document reference with correct collection name and userUID', async () => {
    const userCredential = await createAuthUserWithEmailAndPassword(
      emailTest,
      passTest
    );
    const user = userCredential?.user;
    let error = false;
    if (user) {
      const userDocRef = getUserDocRefFromAuth(user);
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
});
```

Now here's the implementation:

```tsx
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { User } from 'firebase/auth';
import { db } from '../firebase.config';
import { UserDataType, UserDataOptionalType } from './database.types';

import { FbCollectionEnum } from '../firebaseEnum';

export function getUserDocRefFromAuth(user: User) {
  const userUID = user.uid;
  const userDocRef = doc(db, FbCollectionEnum.users, userUID);
  return userDocRef;
}
```

This is a straightforward firebase function. We create a reference document by passing our `db` or firestore configuration, the collection name, and the document ID.
`const userDocRef = doc(db, FbCollectionEnum.users, userUID);`

We don't pass the document ID then firestore will create a random user ID.

This is the basic of all our entries to the firestore. We can use the same implementation later for this.

Now let's move on!

## Create User Collection & Document

In Firestore, the term collection is like a database table in SQL. Previously we already created a user doc reference. We're going to use this to create a collection and also a document.

Before that let's add a function in before each to reset the Firestore database:

```tsx
const projectId = 'smart-resto-inventory';
const resetURL = `http://localhost:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`;

beforeEach(async () => {
  try {
    await deleteAuthUser(emailTest, passTest);
    await fetch(resetURL, { method: 'DELETE' });
  } catch (err) {
    //
  }
});

```

As you can see above that Firebase already provides us with a Rest endpoint to reset the Firestore.

Great now let's create a test. Before it let's create a function to get the document snapshot from firebase:

```tsx
async function getDocumentSnapShotTest() {
  const collectionRef = collection(db, FbCollectionEnum.users);

  const q = query(collectionRef);

  const querySnapShot = await getDocs(q);

  return querySnapShot;
}
```

Now here's the test:

```ts
test('saves user data to firestore from auth user', async () => {
  const nowInMs = Date.now();
  const userCredential = await createAuthUserTest();
  const user = userCredential?.user;
  const inputUserData: UserDataOptionalType = {
    displayName: 'test',
    type: 'super',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!user) {
    throw new Error('something wrong with creating a new auth user');
  }

  await createUserDocument(user, inputUserData);

  const querySnapShot = await getDocumentSnapShotTest();

  const savedUserData = querySnapShot.docs[0].data();

  expect(querySnapShot.size).toBe(1);
  expect(savedUserData.email).toBe(emailTest);
  expect(savedUserData.displayName).toBe('test');
  expect(savedUserData.type).toBe('super');
  expect(savedUserData.createdAt.toDate().getTime()).toBeGreaterThan(nowInMs);
  expect(savedUserData.updatedAt.toDate().getTime()).toBeGreaterThan(nowInMs);
});
```

Now let's move to the implementation in the `users.db.ts`:

```ts
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

import { FbCollectionEnum } from '../firebaseEnum';

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
  const type = 'user';

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
    try {
      await setDoc(userDocRef, userInput);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log('error creating the user', error);
    }
  }
}
```

Explanation:

- `createUserDocument` accepts two parameters, one is the user data, and the second one is the userDataOptional. userDataOptional is the additional data that we'd like to add to the database.
- Then it calls `userDocRef` to create a user Document Reference,
- Then it calls `userExists` to check whether a similar document references exist.
- If it doesn't exist then it creates a new document in Firebase. First it's check whether a collection (users) exists, if not it'll create a new one.
