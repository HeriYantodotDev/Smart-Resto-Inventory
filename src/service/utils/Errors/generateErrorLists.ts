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
