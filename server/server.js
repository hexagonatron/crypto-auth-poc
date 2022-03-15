const express = require('express');
const Web3 = require('web3');
const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 5000;
const ETH_NODE = "http://127.0.0.1:7545";
const JWT_SECRET = "test123";

const MILLISECONDS_IN_SECOND = 1000;
const MILLISECONDS_IN_MINUTE = MILLISECONDS_IN_SECOND * 60;
const MILLISECONDS_IN_5_MINUTES = MILLISECONDS_IN_MINUTE * 5;

const AUTH_TIMEOUT_MILLISECONDS = MILLISECONDS_IN_5_MINUTES;

const web3 = new Web3(ETH_NODE);
const app = express();

const auth_requests = {};

const requestAuth = (address) => {
    if (!address) return null;
    const nonce = uuid();
    auth_requests[address] = { requestTime: Date.now(), nonce: nonce };
    return nonce;
}

const genToken = async (address) => {
    const balance = await web3.eth.getBalance(address);
    const payload = {
        address: address,
        balance: balance,
    }
    return jwt.sign(payload, JWT_SECRET);
}

const verifySigned = async (address, signed) => {
    const authRequest = auth_requests[address];
    if (!authRequest) {
        throw "No auth request found for address";
    }
    if (!signed.message.includes(authRequest.nonce)) {
        throw "Signed message doesn't include correct nonce";
    }
    if (Date.now() - authRequest.requestTime > AUTH_TIMEOUT_MILLISECONDS) {
        throw "Nonce has expired";
    }
    try {
        const signingAccount = await web3.eth.accounts.recover(
            signed.message,
            signed.signature
        );
        console.log(signingAccount);
        console.log(address);
        if (address.toLowerCase() != signingAccount.toLowerCase()) {
            throw "Signing account and request account don't match";
        }
    } catch (err) {
        console.log(err);
        throw (err);
    }

    delete auth_requests[address];
    return true;
}

app.use(express.json());

app.post("/api/auth", async (req, res) => {
    const { address, signed } = req.body;

    if (signed) {
        try {
            verifySigned(address, signed);
            return res.status(200).json({ token: await genToken(address) })
        } catch (error) {
            return res.status(400).json({ error });
        }
    }

    const nonce = requestAuth(address);
    return res.status(200).json({ address: address, nonce: nonce });

});

app.listen(PORT, (err) => {
    if (err) return console.log(err);

    console.log(`Listening on ${PORT}`);
})