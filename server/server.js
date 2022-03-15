const express = require('express');
const Web3 = require('web3');
const { v4: uuid } = require('uuid');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 5000;
const ETH_NODE = "http://127.0.0.1:7545";
const JWT_SECRET = "test123";

const web3 = new Web3(ETH_NODE);
const app = express();

const auth_requests = {};

const requestAuth = (address) => {
    if (!address) return null;
    const nonce = uuid();
    auth_requests[address] = {requestTime: Date.now(), nonce: nonce};
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

const verifySigned = (address, signed) => {
    const authRequest = auth_requests[address];

    return true;
}

app.use(express.json());

app.post("/api/auth", async (req, res) => {
    const {address, signed} = req.body;

    if (signed) {
        if (verifySigned(address, signed)) {
            return res.status(200).json({token: await genToken(address)})
        }
    }

    const nonce = requestAuth(address);
    return res.status(200).json({address: address, nonce: nonce});

});

app.listen(PORT, (err) => {
    if (err) return console.log(err);

    console.log(`Listening on ${PORT}`);
})