const uuid = require('uuid/v1');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Transaction {
    constructor({senderWallet, receipient, amount, outputMap, input}) {
        this.id = uuid();
        this.outputMap = outputMap || this.createOutputMap({senderWallet,receipient,amount});
        this.input = input || this.createInput({senderWallet,outputMap:this.outputMap});
    }

    createInput({senderWallet,outputMap}) {
        return {
            timestamp : Date.now(),
            amount : senderWallet.balance,
            address : senderWallet.publicKey,
            signature : senderWallet.sign(outputMap)
        }
    }

    createOutputMap({senderWallet,receipient,amount}) {
        const outputMap = {};

        outputMap[receipient] = amount;
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;

        return outputMap;
    }

    static validateTransaction(transaction) {
        const { outputMap, input:{address, signature, amount}} = transaction;

        const outputTotal = Object.values(outputMap).reduce((total, totalAmount) => total+totalAmount);

        if(outputTotal !== amount) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }

        if(!verifySignature({data: outputMap, publicKey: address, signature})) {
            console.error(`Invalid signature from ${address}`);
            return false;
        }

        return true;
    }

    update({senderWallet, receipient, amount}) {
        if(amount>this.outputMap[senderWallet.publicKey])
            throw new Error('amount exceeds balance');

        if(!this.outputMap[receipient])
            this.outputMap[receipient] = amount;
        else
            this.outputMap[receipient] = this.outputMap[receipient] + amount;
        
        this.outputMap[senderWallet.publicKey] = this.outputMap[senderWallet.publicKey] - amount;

        this.input = this.createInput({senderWallet,outputMap:this.outputMap});
    }

    static rewardTransaction({minerWallet}) {
        return new this ({
            input: REWARD_INPUT,
            outputMap: {[minerWallet.publicKey]:MINING_REWARD}
        });
    }
}

module.exports = Transaction;