import { FieldValue } from 'firebase/firestore';

export interface UserDataType {
  displayName: string;
  email: string;
  restaurantsIDs: string[];
  type: string;
  createdAt: Date | FieldValue;
  updatedAt: Date | FieldValue;
}

export interface UserDataOptionalType {
  displayName?: string;
  email?: string;
  restaurantsIDs?: string[];
  type?: string;
  createdAt?: Date | FieldValue;
  updatedAt?: Date | FieldValue;
}

export interface UserDataRestaurantsIdsOnly
  extends Pick<UserDataType, 'restaurantsIDs'> {}
