/* eslint-disable max-classes-per-file */
import { FbEnum } from '../enums/firebaseEnum';

export class ErrorUserUpdateWithRestaurantIDs extends Error {
  public code = FbEnum.errorUserUpdateWithRestaurantIDs;

  constructor(message = FbEnum.errorUserUpdateWithRestaurantIDs) {
    super(message);
  }
}

// This is just a place holder
export class PlaceHolder {}
