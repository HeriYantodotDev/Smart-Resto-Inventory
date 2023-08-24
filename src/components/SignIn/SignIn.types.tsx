export interface ErrorStateType {
  [key: string]: string | undefined;
}
export interface ErrorStateSignInType extends ErrorStateType {
  email?: string;
  password?: string;
  auth?: string;
}

export interface Placeholder {
  placeholder: string;
}
