/* eslint-disable import/no-extraneous-dependencies */
import '@testing-library/jest-dom';
// Polyfill "window.fetch" used in the React component.
import 'whatwg-fetch';
import { FirebaseError } from 'firebase/app';
import {
  createAuthUserWithEmailAndPassword,
  deleteAuthUser,
  signInAuthUserWithEmailAndPassword,
} from '../firebase/firebase.auth';

import FbEnum from '../firebase/firebaseEnum';

const emailTest = 'test@gmail.com';
const passTest = 'Drone@123';

beforeEach(async () => {
  try {
    await deleteAuthUser(emailTest, passTest);
  } catch (err) {
    //
  }
});

describe('Firebase Auth Helper Function', () => {
  test('creates a new user Auth with correct credential', async () => {
    const user = await createAuthUserWithEmailAndPassword(emailTest, passTest);
    expect(user?.user.email).toBe(emailTest);
  });

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

  test('returns correct user credential after sign in', async () => {
    await createAuthUserWithEmailAndPassword(emailTest, passTest);
    const user = await signInAuthUserWithEmailAndPassword(emailTest, passTest);
    expect(user?.user.email).toBe(emailTest);
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
});
