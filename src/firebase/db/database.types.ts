export interface UserDataType {
  displayName: string;
  email: string;
  restaurantsIDs: number[];
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDataOptionalType {
  displayName?: string;
  email?: string;
  restaurantsIDs?: number[];
  type?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
