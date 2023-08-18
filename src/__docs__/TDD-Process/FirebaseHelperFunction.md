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
    connectFirestoreEmulator(db, 'http://127.0.0.1', 8080);
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
