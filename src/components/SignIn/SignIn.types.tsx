export interface ErrorStateSignInType {
  email?: string;
  password?: string;
  auth?: string;
  [key: string]: string | undefined;
}

export interface Placeholder {
  placeholder: string;
}
