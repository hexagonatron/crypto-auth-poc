import React from "react";
import { useAuthContext } from "../utils/AuthProvider";

export const Login = () => {
  const { login, logout, token, user } = useAuthContext();
  return (
    <div>
      <div><pre>{JSON.stringify({token, user}, null, 4)}</pre></div>
      <div>
        <button onClick={login}>Login</button>
        <button onClick={logout}>Logout</button>
      </div>
    </div>
  );
};
