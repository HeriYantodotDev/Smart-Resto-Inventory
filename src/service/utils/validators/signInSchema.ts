import { object, string } from 'yup';
import { FbEnum } from '../enums/firebaseEnum';

export const signInSchema = object({
  email: string()
    .required(FbEnum.errorEmptyEmail)
    .email(FbEnum.errorInvalidEmailInput),
  password: string().required(FbEnum.errorEmptyPassword),
}).noUnknown(FbEnum.errorUnknownField);

export async function signInFormValidation(email: string, password: string) {
  await signInSchema.validate(
    {
      email,
      password,
    },
    { abortEarly: false }
  );
}
