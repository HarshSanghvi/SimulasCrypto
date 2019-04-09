const {STARTING_BALANCE} = require('../config');
const { ec, cryptoHash } = require('../util');
const Transaction = require('./transaction');

class Wallet {
    constructor() {
        this.balance = STARTING_BALANCE;

        this.keyPair = ec.genKeyPair();

        this.publicKey = this.keyPair.getPublic().encode('hex');
    }

    sign(data) {
        return this.keyPair.sign(cryptoHash(data));
    }

    createTransaction({amount, receipient, chain}) {
        if(chain) {
            this.balance = Wallet.calculateBalance({
                chain,
                address:this.publicKey
            });
        }
        if(amount>this.balance)
            throw new Error('amount exceeds balance');
        
        return new Transaction({senderWallet : this, receipient, amount});
    }

    static calculateBalance({chain, address}) {
        let conductedTransaction = false;
        let outputsTotal = 0;
        
        for(let i=chain.length-1;i>0;i--){
            const block = chain[i];
            
            for (let transaction of block.data) {
                if(transaction.input.address === address) {
                    conductedTransaction = true;
                }
                const addressOutput = transaction.outputMap[address];

                if(addressOutput)
                    outputsTotal += addressOutput;
            }
            if(conductedTransaction)
                    break;
        }
        return conductedTransaction? outputsTotal: STARTING_BALANCE + outputsTotal;
    }
}

module.exports = Wallet;