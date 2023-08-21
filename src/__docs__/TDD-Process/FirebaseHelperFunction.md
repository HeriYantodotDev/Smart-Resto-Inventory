<!-- TOC start (generated with https://github.com/derlin/bitdowntoc) -->

- [Firebase Helper Function](#firebase-helper-function)
- [Authentication Helper Function](#authentication-helper-function)
- [Firestore: User Collection: Helper Function](#firestore-user-collection-helper-function)
  - [User Document Reference](#user-document-reference)
  - [Create User Collection & Document](#create-user-collection-document)
  - [Create User Collection Permission](#create-user-collection-permission)
  - [Testing User Collection Permission: Get, List, Update, Delete](#testing-user-collection-permission-get-list-update-delete)
    - [Get & List](#get-list)
    - [Update](#update)
    - [Update array field: RestaurantIDs.](#update-array-field-restaurantids)
    - [Delete](#delete)

<!-- TOC end -->

<!-- TOC --><a name="firebase-helper-function"></a>

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

<!-- TOC --><a name="authentication-helper-function"></a>

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

<!-- TOC --><a name="firestore-user-collection-helper-function"></a>

# Firestore: User Collection: Helper Function

Before we create a React component for creating a user, let's add several helper function for User Collection.

<!-- TOC --><a name="user-document-reference"></a>

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

<!-- TOC --><a name="create-user-collection-document"></a>

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

Great, now let's a test case. In this new test case, we'll call the `createUserDocument` without any additional data, therefore we'll modify our test to be like. Also we'll add the `restaurantIDs` field. We forgot to check it.

```ts
test('saves user data to firestore from auth user without additional information', async () => {
  const nowInMs = Date.now();
  const userCredential = await createAuthUserTest();
  const user = userCredential?.user;

  if (!user) {
    throw new Error('something wrong with creating a new auth user');
  }

  await createUserDocument(user);

  const querySnapShot = await getDocumentSnapShotTest();

  const savedUserData = querySnapShot.docs[0].data();

  expect(querySnapShot.size).toBe(1);
  expect(savedUserData.email).toBe(emailTest);
  expect(savedUserData.displayName).not.toBeTruthy();
  expect(savedUserData.type).toBe('user');
  expect(Array.isArray(savedUserData.restaurantsIDs)).toBe(true);
  expect(savedUserData.restaurantsIDs.length).toBe(0);
  expect(savedUserData.createdAt.toDate().getTime()).toBeGreaterThan(nowInMs);
  expect(savedUserData.updatedAt.toDate().getTime()).toBeGreaterThan(nowInMs);
});

test('saves user data to firestore from auth user with additional information', async () => {
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
  expect(Array.isArray(savedUserData.restaurantsIDs)).toBe(true);
  expect(savedUserData.restaurantsIDs.length).toBe(0);
  expect(savedUserData.createdAt.toDate().getTime()).toBeGreaterThan(nowInMs);
  expect(savedUserData.updatedAt.toDate().getTime()).toBeGreaterThan(nowInMs);
});
```

Anyway we haven't worked with the field `restaurantIDs`, we'll work with it later.

<!-- TOC --><a name="create-user-collection-permission"></a>

## Create User Collection Permission

Now we want to ensure this:

> Permissions:
>
> ---
>
> **Users Collection**
>
> - Only authenticated user with user with custom claims: {"role": "admin"} can create users, read and write all users.
> - Allow users to read and write their own document.

We will use these rules:

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userID}/{document=**} {
      allow get: if request.auth != null && ( request.auth.uid == userID || request.auth.token.role == "admin");
      allow list: if request.auth != null && ( request.auth.uid == userID || request.auth.token.role == "admin");
      allow create: if request.auth != null && request.auth.token.role == "admin";
      allow update: if request.auth != null && ( request.auth.uid == userID || request.auth.token.role == "admin");
      allow delete: if request.auth != null && request.auth.token.role == "admin";
    }
  }
}

```

Now please update this rule in the : `firestore.rules`. We can add an extension to give highlight for .rules, there are plenties of it in the market.

read this :

- https://firebase.google.com/docs/firestore/security/get-started
- https://firebase.google.com/docs/firestore/security/rules-structure
- https://firebase.google.com/docs/firestore/security/rules-conditions
- https://firebase.google.com/docs/reference/rules/rules
- https://firebase.google.com/docs/auth/admin/custom-claims

> Notes: read & write can be broken into several operation:

Read:

- get
- list

write:

- create
- update
- delete

However we will broke our previous implementation, therefore let's run our next test first, then we'll fix it later.

First we have to create an Auth User first for super user , let's say like this:

```ts
{
  email: 'supertest@mail.com',
  password: 'Always@123@Happy'
  customClaims: {"role": "admin"}
}
```

We have to create this directly from our console. And in the production is the same, we have to create the auth user and also the user entries for the super user.

Read [this](https://firebase.google.com/docs/auth/admin/custom-claims) for more detail.

> TIPS: Export - Import

You don't have to create in manually in the emulator console. That would be crazy right? To create the user every time we run the test.

- First let's create the auth user and also the the User Collection that contains the superUser.

- Then let's export it. Here's the guide: [guide](https://firebase.google.com/docs/emulator-suite/install_and_configure)

  ```bash
  firebase emulators:export <folder>
  ```

in this case I'm exporting it to folder in our working directory named `emulators`. So `firebase emulators:export emulators`

Great, in those exported file there's a super user already. Now stop the emulator and then change add the command to the package.json:

```json
"emulator:start": "firebase emulators:start --import=emulators",
```

Now every time we'd like to start the emulator we only need to type : `npm run emulator`.

Now we have to modify our test a little bit for beforeEach:

```ts
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
```

Adn since we already imply our new rules, before we delete the collection, we have to sign in first with super user.

```ts
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
```

As you can see we no longer using using Rest API to reset the firebase, instead we manually delete the User Collection. Why? Because we need this super User to be exist before we implement the rules. Without super user, we can't create the user.

Then we should change last two tests.
First we change the function named: `getDocumentSnapShotTest`:

```ts
async function getDocumentSnapShotTest(email: string) {
  const collectionRef = collection(db, FbCollectionEnum.users);

  const q = query(collectionRef, where('email', '==', email));

  const querySnapShot = await getDocs(q);

  return querySnapShot;
}
```

The function above we are looking for certain document that has certain email. Then we use it in our last two tests. Also since we already change our rules above, we have to modify our previous two tests and several tests.

Here are the previous two tests:

```ts
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
```

As you can see the test above we're signing with the Super User first before creating the User Collection Data.

Great now let's add the error case for user without any authentication, and also user with normal user authentication:

```ts
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
```

Don't forget to update our enum:

```ts
export enum FbEnum {
  errorAuthUserNotFound = 'auth/user-not-found',
  errorAuthEmailInUse = 'auth/email-already-in-use',
  errorPermissionDenied = 'permission-denied',
}
```

The enum above is to ensure that we're saving the correct error Code that we're going to use. We don't have to list them all, just for the common one that we're going to use.

And, Voilà! We are ready now for checking for other user permissions like get, list, update, and delete.

Before moving on, let's deploy our current rule to the firebase Production:

```bash
firebase deploy --only firestore:rules
```

Read this for more detail information : https://firebase.google.com/docs/rules/manage-deploy

<!-- TOC --><a name="testing-user-collection-permission-get-list-update-delete"></a>

## Testing User Collection Permission: Get, List, Update, Delete

<!-- TOC --><a name="get-list"></a>

### Get & List

Now let's test for get and list permission.

Before we start we have to revise our rules permission to be like this :

```ts
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userID}/{document=**} {
      allow get: if request.auth != null && ( request.auth.uid == userID || request.auth.token.role == "admin");
      allow list: if request.auth != null && request.auth.token.role == "admin";
      allow create: if request.auth != null && request.auth.token.role == "admin";
      allow update: if request.auth != null && ( request.auth.uid == userID || request.auth.token.role == "admin");
      allow delete: if request.auth != null && request.auth.token.role == "admin";
    }
  }
}
```

We change the rules for `list` to be like this `allow list: if request.auth != null && request.auth.token.role == "admin";` since the previous rule doesn't make sense. request.auth.uid == userID doesn't compatible with listing multiple users.

Then let's deploy our rules : `npm run firestore:rules:deploy` or run on the cli `firebase deploy --only firestore:rules`.

Now here's the test to check for the rules:

```ts
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

  test('returns error "permission-denied" when try to get all users with normal user authentication', async () => {
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

  test('returns all Users when try to get all users with admin user authentication', async () => {
    await createUserCollectionFromAuthTest();
    let querySnapShot: QuerySnapshot<DocumentData, DocumentData> | null = null;
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
```

Now let's add test and a function named `getUser` :

```ts
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

  test('returns error "permission-denied" when try to get other user document from normal user authentication', async () => {
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

  test('returns user document when try to get other its own user document data from normal user authentication', async () => {
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

  test('returns user document when try to get other other user document data from admin user authentication', async () => {
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
```

Here's the implementation:

```ts
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
```

<!-- TOC --><a name="update"></a>

### Update

Read this for more detail: https://firebase.google.com/docs/firestore/manage-data/add-data

Great now let's add test for update and delete.

Before we start creating the test and the implementation, let's change the rules to be like this:

```ts
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userID}/{document=**} {
      allow get: if request.auth != null && ( request.auth.uid == userID || request.auth.token.role == "admin");
      allow list: if request.auth != null && request.auth.token.role == "admin";
      allow create: if request.auth != null && request.auth.token.role == "admin";
      allow update: if request.auth != null && request.auth.token.role == "admin";
      allow delete: if request.auth != null && request.auth.token.role == "admin";
    }
  }
}
```

Previously I created a rule in which the user and change their own data, however the project requirement is to ensure that a user can't access other user data including later in restaurant document. Therefore only admin user can modify the user and create a relationship between the user and the restaurant.

Then let's deploy the function to firestore production.

Great! Now let's add the test for user update. There are four test cases, we check the permission, and also when update the user, we only update the field that we specify.

```ts
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
});
```

and here's the implementation:

```ts
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
```

However it's better if we're using `updateDoc` function that is already provided by firestore:

```ts
export async function updateUserDocument(
  userUID: string,
  userInput: UserDataOptionalType
) {
  const userDocRef = createUserDocRefFromUserUID(userUID);

  const userInputWithUpdatedAt = {
    ...userInput,
    updatedAt: new Date(),
  };

  await updateDoc(userDocRef, userInputWithUpdatedAt);
}
```

We can also using `serverTimestamp()` from firebase to track when the server receives the update.

So let's change our `updateUserDocument` to be like this:

```
export async function updateUserDocument(
  userUID: string,
  userInput: UserDataOptionalType
) {
  const userDocRef = createUserDocRefFromUserUID(userUID);

  const userInputWithUpdatedAt = {
    ...userInput,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(userDocRef, userInputWithUpdatedAt);
}
```

And also our previous implementation in the `generateUserInput` to be like this:

```ts
function generateUserInput(
  user: User,
  userDataOptional: UserDataOptionalType
): UserDataType {
  const displayName = user.displayName || '';
  const email = user.email || '';
  const restaurantsIDs: number[] = [];
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
```

Of course we have to change the types also:

```ts
import { FieldValue } from 'firebase/firestore';

export interface UserDataType {
  displayName: string;
  email: string;
  restaurantsIDs: number[];
  type: string;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

export interface UserDataOptionalType {
  displayName?: string;
  email?: string;
  restaurantsIDs?: number[];
  type?: string;
  createdAt?: Date | FieldValue;
  updatedAt?: Date | FieldValue;
}
```

In this way, When updating multiple timestamp fields inside of a transaction, each field receives the same server timestamp value.

<!-- TOC --><a name="update-array-field-restaurantids"></a>

### Update array field: RestaurantIDs.

Here's a tricky one, while others only have one entries, the array filed for `restaurantIDs` contains several input. After thinking for a while, I think I have to separate the user update with the restaurantIDs update. So the user update is updating all field except `restaurantIds`

The first thing is to create an error if the user tries to send the update document with the `restaurantIDs` property. Let's create a test for it:

```ts
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
```

Here's the implementation:

```ts
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
```

And here's the error class:

```ts
import { FbEnum } from '../enums/firebaseEnum';

export class ErrorUserUpdateWithRestaurantIDs extends Error {
  public code = FbEnum.errorUserUpdateWithRestaurantIDs;

  constructor(message = FbEnum.errorUserUpdateWithRestaurantIDs) {
    super(message);
  }
}
```

Great now let's using `arrayUnion()` and `arrayRemove()` to modify the `restaurantsIDs` field. Let's create two helper functions named: `addUserRestaurantsIDs` and `removeUserRestaurantsIDs`.

Here are the tests:

> Notes: We don't have to test with different authentication since we already tested it before for `userDoc`. Only focus on the array `restaurantsIDs`

```ts
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
```

And here's the implementation for it:

```ts
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
```

Okay now this is the last one about delete User Document.

<!-- TOC --><a name="delete"></a>

### Delete
