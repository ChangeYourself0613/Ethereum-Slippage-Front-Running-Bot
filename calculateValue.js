const { ethers, BigNumber } = require('ethers')

const BigNum = require('bignumber.js');
const { type } = require('os');
BigNum.config({
    DECIMAL_PLACES: 0,
    ROUNDING_MODE: BigNum.ROUND_HALF_UP
});

function calculateValue(reserveWeth, reserveToken, amountIn, minAmountOut, slippage) {
    // Calculate the numerator
    const amountOutMin = minAmountOut.add(slippage.mul(BigNumber.from(5)).div(BigNumber.from(100)))

    const buyAmount = BigNumber.from((
        sqrt(((BigNumber.from(3964107892000)).mul(reserveWeth).mul(reserveToken).mul(amountIn).mul(amountOutMin))
            .add((BigNumber.from(988053892081)).mul(pow(amountIn, 2)).mul(pow(amountOutMin, 2))))
            .sub(((BigNumber.from(1994000)).mul(reserveWeth).mul(amountOutMin)))
            .sub((BigNumber.from(994009)).mul(amountIn).mul(amountOutMin))))
        .div((BigNumber.from(1988018)).mul(amountOutMin))

    // Return the final result
    return buyAmount;
}

function sqrt(value) {
    return BigNumber.from(BigNum(value.toString()).sqrt().toFixed()); // Convert to string for compatibility
}

function pow(base, exponent) {
    return BigNumber.from(BigNum(base.toString()).pow(exponent).toFixed()); // Convert to string for compatibility
}

// calculateValue(BigNumber.from("13271692241491071690"), BigNumber.from("28997353043437441522"), BigNumber.from("450000000000000000"), BigNumber.from("614406909252201670"), (BigNumber.from("616816101114464487")).sub(BigNumber.from("614406909252201670")))
module.exports = { calculateValue }