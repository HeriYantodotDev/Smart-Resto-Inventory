export enum FbEnum {
  errorAuthUserNotFound = 'auth/user-not-found',
  errorAuthEmailInUse = 'auth/email-already-in-use',
  errorWrongPassword = 'auth/wrong-password',
  errorPermissionDenied = 'permission-denied',
  errorUserUpdateWithRestaurantIDs = 'user-update/with-restaurant-ids',
  errorInvalidEmailInput = 'errorInvalidEmailInput',
  errorEmptyEmail = 'errorEmptyEmail',
  errorEmptyPassword = 'errorEmptyPassword',
  errorAuth = 'errorAuth',
  errorUnknownField = 'errorUnknownField',
}

export enum FbCollectionEnum {
  users = 'users',
}

export enum FbUserTypeEnum {
  admin = 'admin',
  user = 'user',
}
