import { useCallback, MouseEvent, useState } from 'react';

import { FirebaseError } from 'firebase/app';
import { ValidationError } from 'yup';

import FormInput from '../FormInput/FormInput.component';
import Button from '../Button/Button.component';
import TextLogo from '../TextLogo/TextLogo.component';
import useInputState from '../../service/utils/state/useInputState';
import Spinner from '../Spinner/Spinner.component';
import ErrorFormText from '../ErrorFormText/ErrorFormText.component';
import Information from '../Information/Information.component';
import { ErrorStateSignInType } from './SignIn.types';

import { signInAuthUserWithEmailAndPassword } from '../../service/firebase/firebase.auth';
import { signInFormValidation } from '../../service/utils/validators/signInSchema';
import {
  generateErrorListValidationError,
  generateErrorListFirebaseError,
} from '../../service/utils/Errors/generateErrorLists';

const defaultValue = '';

export default function SignIn() {
  const [errors, setErrors] = useState<ErrorStateSignInType>({});
  const emailInput = useInputState(errors, setErrors, defaultValue, 'auth');
  const passwordInput = useInputState(errors, setErrors, defaultValue, 'auth');
  const [apiProgress, setApiProgress] = useState(false);
  const [signInSuccess, setSignInSuccess] = useState(false);

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
        setSignInSuccess(true);
      } catch (err) {
        handleError(err);
        setApiProgress(false);
      }
    },
    [emailInput.value, passwordInput.value]
  );

  return (
    <div className="flex h-screen items-center justify-center">
      <div>
        {!signInSuccess && (
          <form
            className="w-80 rounded-lg bg-slate-800 bg-opacity-40  pb-7 pt-7 text-center"
            data-testid="formSignUp"
          >
            <div className="flex items-center justify-center pt-4">
              <TextLogo>Kopi Satu</TextLogo>
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
                error={errors.email}
              />
              <FormInput
                onChange={passwordInput.onchange}
                labelName="Password"
                htmlFor="password"
                id="password"
                value={passwordInput.value}
                type="password"
                error={errors.password}
              />
              {errors.auth && (
                <div>
                  <ErrorFormText>{errors.auth}</ErrorFormText>
                </div>
              )}
              <Button onClick={handleSubmit} disabled={apiProgress}>
                {apiProgress ? <Spinner /> : 'Sign In'}
              </Button>
            </div>
          </form>
        )}

        {signInSuccess && (
          <Information>
            You have successfully signed in. You will be redirected to the
            dashboard page in 3 seconds.
          </Information>
        )}
      </div>
    </div>
  );
}
