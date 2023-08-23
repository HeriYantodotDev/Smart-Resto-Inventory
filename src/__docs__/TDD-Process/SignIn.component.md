# Sign In Component Test

Let's divide the test into three categories:

- Layout
- Interaction
- Internationalization

Before start the test, let's install a development dependency that will help us a lot when running the test:

```bash
npm install --save-dev jest-watch-typeahead
```

And then add this :

```ts
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
```

This makes us easier to filter the file test

## Layout & Interaction

Let's write our first test:

- Test

```ts
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

import { emailTest, passTest } from './helper';

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
  let button: HTMLElement | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function renderAndFill(userEventProps: any) {
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    await userEventProps.type(emailInput, emailTest);
    await userEventProps.type(passwordInput, passTest);
    button = screen.queryByRole('button', { name: 'Sign In' });
  }

  describe('Interaction', () => {
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

    test.only('hides spinner, shows "Sign In" in the button and enables button after response received', async () => {
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
  });

  // describe('Internationalization', () => {

  // });
});
```

Great now let's write out implementation:

- Implementation:

  ```ts
  import { useCallback, MouseEvent, useState } from 'react';
  import FormInput from '../FormInput/FormInput.component';
  import Button from '../Button/Button.component';
  import TextLogo from '../TextLogo/TextLogo.component';
  import useInputState from '../../service/utils/state/useInputState';
  import Spinner from '../Spinner/Spinner.component';

  import { signInAuthUserWithEmailAndPassword } from '../../service/firebase/firebase.auth';

  export default function SignIn() {
    const emailInput = useInputState();
    const passwordInput = useInputState();
    const [apiProgress, setApiProgress] = useState(false);

    const handleSubmit = useCallback(
      async (event: MouseEvent<HTMLButtonElement>) => {
        try {
          event.preventDefault();
          setApiProgress(true);
          await signInAuthUserWithEmailAndPassword(
            emailInput.value,
            passwordInput.value
          );
          setApiProgress(false);
        } catch (err) {
          setApiProgress(false);
        }
      },
      [emailInput.value, passwordInput.value]
    );

    return (
      <div
        className="flex h-screen items-center justify-center"
        data-testid="signUpPage"
      >
        <div>
          <form
            className="w-80 rounded-lg bg-slate-800 bg-opacity-40  pb-7 pt-7 text-center"
            data-testid="formSignUp"
          >
            <div className="flex items-center justify-center pt-4">
              <TextLogo>SRI</TextLogo>
            </div>
            <div className="flex h-20 items-center justify-center">
              <h1 className="text-4xl text-white">Sign In</h1>
            </div>
            <div className="mx-6 my-6">
              <FormInput
                onChange={emailInput.onchange}
                labelName="Email"
                htmlFor="email"
                id="email"
                value={emailInput.value}
                type="text"
              />
              <FormInput
                onChange={passwordInput.onchange}
                labelName="Password"
                htmlFor="password"
                id="password"
                value={passwordInput.value}
                type="password"
              />
              <Button onClick={handleSubmit} disabled={apiProgress}>
                {apiProgress ? <Spinner /> : 'Sign In'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  ```

  As you can see that we're adding several several components beside the `SignIn.component` such as:

  - Button
  - ErrorFormText
  - FormInput
  - Spinner
  - TextLogo

  Since they are pretty straightforward, I don't have to jot it down in this documentation.

Now let's move to the validation. There are several error cases we'd like to handle:

- Validation Error
  - Empty email
  - Not a proper format of an email.
  - Empty password
- Authentication Failure: either email not found or password incorrect. We don't want to give a specific information to the front end so just authentication failure.

We have to install the `yup` library first. https://www.npmjs.com/package/yup

Here are the test for validation error, and then for authentication failure both for unregistered user or wrong password :

```ts
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
```

In our implementation in the `SignIn` component I added several functions:

```ts
function handleError(err: unknown) {
  if (err instanceof ValidationError) {
    const errorList = generateErrorListValidationError(err);
    setErrors(errorList);
    return;
  }

  if (err instanceof FirebaseError) {
    const errorList = generateErrorListFirebaseError(err);
    setErrors(errorList);
    return;
  }

  setErrors({
    auth: 'UnknownError',
  });
}

const handleSubmit = useCallback(
  async (event: MouseEvent<HTMLButtonElement>) => {
    try {
      event.preventDefault();
      setApiProgress(true);
      await signInFormValidation(emailInput.value, passwordInput.value);
      await signInAuthUserWithEmailAndPassword(
        emailInput.value,
        passwordInput.value
      );
      setApiProgress(false);
    } catch (err) {
      handleError(err);
      setApiProgress(false);
    }
  },
  [emailInput.value, passwordInput.value]
);
```

I also created several helper functions to generate Error Lists:
`generateErrorLists,ts`

```ts
import { FirebaseError } from 'firebase/app';
import { ValidationError } from 'yup';

import { FbEnum } from '../enums/firebaseEnum';

type ErrorStateType = {
  [key: string]: string | undefined;
};

export function generateErrorListValidationError(err: ValidationError) {
  let errorList: ErrorStateType = {} as ErrorStateType;
  err.inner.forEach((inner) => {
    const path = inner.params?.path ?? '';
    const errorMessageKey = path as keyof ErrorStateType;
    errorList = {
      ...errorList,
      [errorMessageKey]: inner.errors[0],
    };
  });
  return errorList;
}

export function generateErrorListFirebaseError(err: FirebaseError) {
  let errorList: ErrorStateType = {};
  if (
    err.code === FbEnum.errorAuthUserNotFound ||
    err.code === FbEnum.errorWrongPassword
  ) {
    errorList = { auth: FbEnum.errorAuth };
  }
  return errorList;
}
```
