import '@testing-library/jest-dom';
import 'whatwg-fetch';
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SignIn from '../components/SignIn/SignIn.component';
// Extend Jest "expect" functionality with Testing Library assertions.

import { emailTest, passTest, superEmail, superPassword } from './helper';
import { FbEnum } from '../service/utils/enums/firebaseEnum';

import { signOutUser } from '../service/firebase/firebase.auth';

function setup(jsx: JSX.Element) {
  return {
    user: userEvent.setup(),
    ...render(jsx),
  };
}

describe('Sign In Component', () => {
  describe('Layout', () => {
    test('[Essential Element] has a header, two input forms: email+password, textLogo and a button', () => {
      render(<SignIn />);
      const header = screen.queryByRole('heading', { name: 'Sign In' });
      const emailInput = screen.queryByLabelText('Email');
      const passwordInput = screen.queryByLabelText('Password');
      const button = screen.queryByRole('button', { name: 'Sign In' });
      const textLogo = screen.queryByTestId('textLogo');
      expect(header).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
      expect(button).toBeInTheDocument();
      expect(textLogo).toBeInTheDocument();
    });
  });

  // TO DO: Move this block if we don't use it in the Internationalization or Reducer
  let button: HTMLElement | null;
  const defaultSignInInput: Record<string, string> = {
    email: emailTest,
    password: passTest,
  };

  async function renderAndFill(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    userEventProps: any,
    signInInput = defaultSignInInput
  ) {
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    if (signInInput.email) {
      await userEventProps.type(emailInput, signInInput.email);
    }

    if (signInInput.password) {
      await userEventProps.type(passwordInput, signInInput.password);
    }

    button = screen.queryByRole('button', { name: 'Sign In' });
  }

  describe('Interaction', () => {
    beforeEach(async () => {
      await signOutUser();
    });

    test('displays spinner and hides "Sign In" text in the button after clicking the submit button', async () => {
      const { user } = setup(<SignIn />);

      await renderAndFill(user);
      const spinnerBefore = screen.queryByRole('status');
      expect(spinnerBefore).not.toBeInTheDocument();

      if (!button) {
        fail('Button is not found');
      }

      await user.click(button);

      await waitFor(() => {
        const spinner2 = screen.queryByRole('status');
        expect(spinner2).toBeInTheDocument();

        const text = screen.queryByText('Sign In', { selector: 'button' });
        expect(text).not.toBeInTheDocument();
      });
    });

    test("disables submit button when there's an ongoing API Request", async () => {
      const { user } = setup(<SignIn />);
      await renderAndFill(user);

      if (!button) {
        fail('Button is not found');
      }

      await user.click(button);
      expect(button).toBeDisabled();
    });

    test('hides spinner, shows "Sign In" in the button and enables button after response received', async () => {
      const { user } = setup(<SignIn />);
      await renderAndFill(user);

      if (!button) {
        fail('Button is not found');
      }

      await user.click(button);

      const spinner = screen.queryByRole('status');
      await waitForElementToBeRemoved(spinner);

      const text = screen.queryByText('Sign In', { selector: 'button' });
      expect(text).toBeInTheDocument();
      expect(spinner).not.toBeInTheDocument();
      expect(button).toBeEnabled();
    });

    test.each`
      field         | value      | message
      ${'email'}    | ${''}      | ${FbEnum.errorEmptyEmail}
      ${'email'}    | ${'test'}  | ${FbEnum.errorInvalidEmailInput}
      ${'email'}    | ${'test@'} | ${FbEnum.errorInvalidEmailInput}
      ${'password'} | ${''}      | ${FbEnum.errorEmptyPassword}
    `(
      'display error message $message for field $field when log in with invalid format',
      async ({ field, value, message }) => {
        const { user } = setup(<SignIn />);
        const signInInput: Record<string, string> = {
          email: emailTest,
          password: passTest,
        };

        signInInput[field] = value;

        await renderAndFill(user, signInInput);

        if (!button) {
          fail('Button is not found');
        }

        await user.click(button);

        const validationError = await screen.findByText(message);

        expect(validationError).toBeInTheDocument();
      }
    );

    test(`display error message "${FbEnum.errorAuth}" when login with unregistered user`, async () => {
      const { user } = setup(<SignIn />);
      const signInInput: Record<string, string> = {
        email: emailTest,
        password: passTest,
      };

      await renderAndFill(user, signInInput);

      if (!button) {
        fail('Button is not found');
      }

      await user.click(button);

      const validationError = await screen.findByText(FbEnum.errorAuth);

      expect(validationError).toBeInTheDocument();
    });

    test(`display error message "${FbEnum.errorAuth}" when login with registered user but wrong password`, async () => {
      const { user } = setup(<SignIn />);
      const signInInput: Record<string, string> = {
        email: superEmail,
        password: passTest,
      };

      await renderAndFill(user, signInInput);

      if (!button) {
        fail('Button is not found');
      }

      await user.click(button);

      const validationError = await screen.findByText(FbEnum.errorAuth);

      expect(validationError).toBeInTheDocument();
    });

    test.each`
      field         | value      | message                          | label
      ${'email'}    | ${''}      | ${FbEnum.errorEmptyEmail}        | ${'Email'}
      ${'email'}    | ${'test'}  | ${FbEnum.errorInvalidEmailInput} | ${'Email'}
      ${'email'}    | ${'test@'} | ${FbEnum.errorInvalidEmailInput} | ${'Email'}
      ${'password'} | ${''}      | ${FbEnum.errorEmptyPassword}     | ${'Password'}
    `(
      'clears error message $message for field "$field" after "$field" is updated',
      async ({ field, value, message, label }) => {
        const { user } = setup(<SignIn />);
        const signInInput: Record<string, string> = {
          email: emailTest,
          password: passTest,
        };

        signInInput[field] = value;

        await renderAndFill(user, signInInput);

        if (!button) {
          fail('Button is not found');
        }

        await user.click(button);

        const validationError = await screen.findByText(message);

        await user.type(screen.getByLabelText(label), 'randomUpdated');

        expect(validationError).not.toBeInTheDocument();
      }
    );

    test.each`
      label
      ${'Email'}
      ${'Password'}
    `(
      `clears error message ${FbEnum.errorAuth} if field "$label" is updated`,
      async ({ label }) => {
        const { user } = setup(<SignIn />);
        const signInInput: Record<string, string> = {
          email: superEmail,
          password: passTest,
        };

        await renderAndFill(user, signInInput);

        if (!button) {
          fail('Button is not found');
        }

        await user.click(button);

        const validationError = await screen.findByText(FbEnum.errorAuth);

        await user.type(screen.getByLabelText(label), 'randomUpdated');

        expect(validationError).not.toBeInTheDocument();
      }
    );

    test('hides sign in form after successful sign in request', async () => {
      const { user } = setup(<SignIn />);
      const signInInput: Record<string, string> = {
        email: superEmail,
        password: superPassword,
      };

      await renderAndFill(user, signInInput);

      if (!button) {
        fail('Button is not found');
      }

      const form = screen.getByTestId('formSignUp');

      await user.click(button);

      await waitFor(() => {
        expect(form).not.toBeInTheDocument();
      });
    });
  });

  test('displays redirection notification after successful sign in', async () => {
    const message =
      'You have successfully signed in. You will be redirected to the dashboard page in 3 seconds.';
    const { user } = setup(<SignIn />);
    const signInInput: Record<string, string> = {
      email: superEmail,
      password: superPassword,
    };

    await renderAndFill(user, signInInput);

    if (!button) {
      fail('Button is not found');
    }

    expect(screen.queryByText(message)).not.toBeInTheDocument();

    await user.click(button);

    await waitFor(() => {
      const text = screen.getByText(message);
      expect(text).toBeInTheDocument();
    });
  });

  // describe('Internationalization', () => {

  // });
});
