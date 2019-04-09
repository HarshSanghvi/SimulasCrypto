const block = require('./Block');
const { cryptoHash } = require('../util');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Blockchain {
    constructor(){
        this.chain = [block.genesis()];
    }

    addBlock({data}) {
        const lastBlock = this.chain[this.chain.length-1];
        const mineBlock = block.mineBlock({lastBlock,data});
        this.chain.push(mineBlock);
    }

    static isValidChain(chain) {
        if(JSON.stringify(chain[0])!==JSON.stringify(block.genesis())) return false;

        for(let i=1;i<chain.length;i++) {
            const {timestamp, hash, lasthash, data, nonce, difficulty} = chain[i];
            const lastDifficulty = chain[i-1].difficulty;

            const actualLastHash = chain[i-1].hash;

            if(lasthash !== actualLastHash) return false;

            const validatedHash = cryptoHash(timestamp, lasthash, data, nonce, difficulty);

            if(hash !== validatedHash) return false;

            if(Math.abs(lastDifficulty-difficulty) > 1) return false;
        }

        return true;
    }

    replaceChain(chain, validateTransaction, onSuccess) {
        if(chain.length <= this.chain.length) {
            console.error("incoming chain must be longer");
            return;
        }
        if(!Blockchain.isValidChain(chain)) {
            console.error("incoming chain must be valid");
            return;
        }

        if(validateTransaction && !this.validateTransactionData({chain}))
        {
            console.error("transaction data validation failed");
            return;
        }
        if(onSuccess) onSuccess();
        console.log("replacing chain with == " , chain);
        this.chain = chain;
    }

    validateTransactionData({chain}) {
        for(let i=1;i<chain.length;i++) {
            let rewardTransactionCount = 0;
            const transactionSet = new Set();
            const block = chain[i];
            for(let transaction of block.data) {
                if(transaction.input.address === REWARD_INPUT.address) {
                    rewardTransactionCount++;

                    if(rewardTransactionCount>1) {
                        console.error('miner rewards exceeded limit');
                        return false;
                    }

                    if(Object.values(transaction.outputMap)[0] !== MINING_REWARD) {
                        console.error('malformed output map data for reward transactions');
                        return false;
                    }
                } else {
                    if(!Transaction.validateTransaction(transaction)) {
                        console.error('malformed output map data for other transactions');
                        return false;
                    }

                    const trueBalance = Wallet.calculateBalance({
                        chain:this.chain,
                        address:transaction.input.address
                    });

                    if(transaction.input.amount !== trueBalance){
                        console.error('malformed input data for other transactions');
                        return false;
                    }

                    if(transactionSet.has(transaction)) {
                        console.error('identical transactions found');
                        return false;
                    } else {
                        transactionSet.add(transaction);
                    }
                }
            }
        }
        return true;
    }
}

module.exports = Blockchain;