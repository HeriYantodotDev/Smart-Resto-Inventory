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
