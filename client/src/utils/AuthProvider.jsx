import React, { createContext, useContext, useState } from "react";
import decode from "jwt-decode";

const AuthContext = createContext();

export const useAuthContext = () => useContext(AuthContext);

const genMessage = (nonce) => {
  if (!nonce) {
    throw "No nonce provided";
  }
  return `To prove you own this address, please sign the following nonce ${nonce}`;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const { ethereum } = window;

  const requestAddress = async () => {
    if (!ethereum) {
      return console.error("Must have Eth provider");
    }

    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    return accounts[0];
  };

  const getNonce = async (address) => {
    if (!address) {
      throw "No address";
    }
    const response = await fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify({ address }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => response.json());

    return response.nonce;
  };

  const signNonce = async (nonce, address) => {
    if (!nonce) {
      return console.error("No nonce");
    }
    const inputMsg = genMessage(nonce);
    const signed = await ethereum.request({
      method: "personal_sign",
      params: [inputMsg, address],
    });

    console.log(signed);

    return { inputMsg, signed };
  };

  const sendSigned = async (signed, address, nonce) => {
    const response = await fetch("/api/auth", {
      method: "POST",
      body: JSON.stringify({ signed, nonce, address }),
      headers: {
        "Content-Type": "application/json",
      },
    }).then((response) => response.json());

    console.log(response);
    const decoded = decode(response.token);
    setUser(decoded);
    setToken(response.token);
  };

  const loggedIn = () => !!token;

  const login = async () => {
    const address = await requestAddress();
    const nonce = await getNonce(address);
    const signed = await signNonce(nonce, address);
    sendSigned(signed, address, nonce);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
