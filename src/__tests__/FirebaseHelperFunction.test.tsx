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
