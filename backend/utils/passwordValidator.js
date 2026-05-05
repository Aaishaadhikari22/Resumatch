export const PASSWORD_POLICY = {
  regex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/, 
  message: "Password must be at least 8 characters long and include uppercase, lowercase, a number, and a special character."
};

export const validatePassword = (password) => {
  if (typeof password !== "string") return false;
  return PASSWORD_POLICY.regex.test(password);
};
