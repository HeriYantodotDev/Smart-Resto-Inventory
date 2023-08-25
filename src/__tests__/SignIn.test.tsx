import '@testing-library/jest-dom';
import 'whatwg-fetch';
import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { act } from 'react-dom/test-utils';
import i18n from '../locale/i18n';

import SignIn from '../components/SignIn/SignIn.component';
// Extend Jest "expect" functionality with Testing Library assertions.

import { emailTest, passTest, superEmail, superPassword } from './helper';

import { signOutUser } from '../service/firebase/firebase.auth';

import LanguageSelector from '../components/LanguageSelector/LanguageSelector.component';

import * as en from '../locale/en.json';
import * as id from '../locale/id.json';

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
      ${'email'}    | ${''}      | ${en.errorEmptyEmail}
      ${'email'}    | ${'test'}  | ${en.errorInvalidEmailInput}
      ${'email'}    | ${'test@'} | ${en.errorInvalidEmailInput}
      ${'password'} | ${''}      | ${en.errorEmptyPassword}
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

    test(`display error message "${en.errorAuth}" when login with unregistered user`, async () => {
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

      const validationError = await screen.findByText(en.errorAuth);

      expect(validationError).toBeInTheDocument();
    });

    test(`display error message "${en.errorAuth}" when login with registered user but wrong password`, async () => {
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

      const validationError = await screen.findByText(en.errorAuth);

      expect(validationError).toBeInTheDocument();
    });

    test.each`
      field         | value      | message                      | label
      ${'email'}    | ${''}      | ${en.errorEmptyEmail}        | ${'Email'}
      ${'email'}    | ${'test'}  | ${en.errorInvalidEmailInput} | ${'Email'}
      ${'email'}    | ${'test@'} | ${en.errorInvalidEmailInput} | ${'Email'}
      ${'password'} | ${''}      | ${en.errorEmptyPassword}     | ${'Password'}
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
      `clears error message ${en.errorAuth} if field "$label" is updated`,
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

        const validationError = await screen.findByText(en.errorAuth);

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
    const { user } = setup(<SignIn />);
    const signInInput: Record<string, string> = {
      email: superEmail,
      password: superPassword,
    };

    await renderAndFill(user, signInInput);

    if (!button) {
      fail('Button is not found');
    }

    expect(
      screen.queryByText(en.signInSuccessNotification)
    ).not.toBeInTheDocument();

    await user.click(button);

    await waitFor(() => {
      const text = screen.getByText(en.signInSuccessNotification);
      expect(text).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    afterEach(() => {
      act(() => {
        i18n.changeLanguage('en');
      });
    });

    function SignInWithLanguageSelector() {
      return (
        <div>
          <LanguageSelector />
          <SignIn />
        </div>
      );
    }
    test('displays all the text in english in the beginning', () => {
      render(<SignIn />);

      expect(
        screen.getByRole('heading', { name: en.signIn })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: en.signIn })
      ).toBeInTheDocument();

      expect(screen.getByLabelText(en.email)).toBeInTheDocument();
      expect(screen.getByLabelText(en.password)).toBeInTheDocument();
    });

    test('displays all text in Indonesia after changing the language to Indonesian', async () => {
      const { user } = setup(<SignInWithLanguageSelector />);

      const langToggle = screen.getByTitle('Indonesian');

      await user.click(langToggle);

      expect(
        screen.getByRole('heading', { name: id.signIn })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: id.signIn })
      ).toBeInTheDocument();

      expect(screen.getByLabelText(id.email)).toBeInTheDocument();
      expect(screen.getByLabelText(id.password)).toBeInTheDocument();
    });

    test('displays all text in English after changing the language to Indonesian then to English', async () => {
      const { user } = setup(<SignInWithLanguageSelector />);

      const IDToggle = screen.getByTitle('Indonesian');

      await user.click(IDToggle);

      const ENToggle = screen.getByTitle('English');

      await user.click(ENToggle);

      expect(
        screen.getByRole('heading', { name: en.signIn })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: en.signIn })
      ).toBeInTheDocument();

      expect(screen.getByLabelText(en.email)).toBeInTheDocument();
      expect(screen.getByLabelText(en.password)).toBeInTheDocument();
    });

    test.each`
      field         | value      | message
      ${'email'}    | ${''}      | ${id.errorEmptyEmail}
      ${'email'}    | ${'test'}  | ${id.errorInvalidEmailInput}
      ${'email'}    | ${'test@'} | ${id.errorInvalidEmailInput}
      ${'password'} | ${''}      | ${id.errorEmptyPassword}
    `(
      'display error message $message for field $field when log in with invalid format',
      async ({ field, value, message }) => {
        const { user } = setup(<SignInWithLanguageSelector />);
        const signInInput: Record<string, string> = {
          email: emailTest,
          password: passTest,
        };

        signInInput[field] = value;

        await renderAndFill(user, signInInput);

        const IDToggle = screen.getByTitle('Indonesian');

        await user.click(IDToggle);

        if (!button) {
          fail('Button is not found');
        }

        await user.click(button);

        const validationError = await screen.findByText(message);

        expect(validationError).toBeInTheDocument();
      }
    );

    test(`display error message "${id.errorAuth}" when login with unregistered user and language is ID`, async () => {
      const { user } = setup(<SignInWithLanguageSelector />);
      const signInInput: Record<string, string> = {
        email: emailTest,
        password: passTest,
      };

      await renderAndFill(user, signInInput);

      const IDToggle = screen.getByTitle('Indonesian');

      await user.click(IDToggle);

      if (!button) {
        fail('Button is not found');
      }

      await user.click(button);

      const validationError = await screen.findByText(id.errorAuth);

      expect(validationError).toBeInTheDocument();
    });

    test(`display error message "${id.errorAuth}" when login with registered user but wrong password and language is ID`, async () => {
      const { user } = setup(<SignInWithLanguageSelector />);
      const signInInput: Record<string, string> = {
        email: superEmail,
        password: passTest,
      };

      await renderAndFill(user, signInInput);

      const IDToggle = screen.getByTitle('Indonesian');

      await user.click(IDToggle);

      if (!button) {
        fail('Button is not found');
      }

      await user.click(button);

      const validationError = await screen.findByText(id.errorAuth);

      expect(validationError).toBeInTheDocument();
    });

    test('displays redirection notification in Indonesian after successful sign in and language is Indonesian', async () => {
      const { user } = setup(<SignInWithLanguageSelector />);
      const signInInput: Record<string, string> = {
        email: superEmail,
        password: superPassword,
      };

      await renderAndFill(user, signInInput);

      const IDToggle = screen.getByTitle('Indonesian');

      await user.click(IDToggle);

      if (!button) {
        fail('Button is not found');
      }

      expect(
        screen.queryByText(id.signInSuccessNotification)
      ).not.toBeInTheDocument();

      await user.click(button);

      await waitFor(() => {
        const text = screen.getByText(id.signInSuccessNotification);
        expect(text).toBeInTheDocument();
      });
    });
  });
});
