export enum FbEnum {
  errorAuthUserNotFound = 'auth/user-not-found',
  errorAuthEmailInUse = 'auth/email-already-in-use',
  errorPermissionDenied = 'permission-denied',
  errorUserUpdateWithRestaurantIDs = 'user-update/with-restaurant-ids',
}

export enum FbCollectionEnum {
  users = 'users',
}

export enum FbUserTypeEnum {
  admin = 'admin',
  user = 'user',
}
