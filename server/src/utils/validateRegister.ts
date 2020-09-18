import {UsernamePasswordInput} from "../resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (!options.email.includes('@')) { //Only checks for @ in email
    return [
      {
        field: "email",
        message: "Invalid email",
      },
    ];
  }

  if (options.username.length <= 2) {
    return [
      {
        field: "username",
        message: "Username must be greater than 2 characters",
      },
    ];
  }

  if (options.username.includes('@')) {
    return [
      {
        field: "username",
        message: "Username cannot contain an @ symbol",
      },
    ];
  }

  if (options.password.length <= 2) {
    return [
      {
        field: "password",
        message: "Password must be greater than 2 characters",
      },
    ];
  }
  return null;
}
