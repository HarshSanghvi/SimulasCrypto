const Transaction = require('../wallet/transaction');

class TransactionMiner {
    constructor({blockchain, transactionPool, wallet, pubsub}){
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;
        this.pubsub = pubsub;
    }

    mineTransaction(){
        // get valid transaction from transaction pool
        const validTransactions = this.transactionPool.validTransactions();

        // generate mining reward
        const minerReward = Transaction.rewardTransaction({minerWallet: this.wallet});
        validTransactions.push(minerReward);

        // add a block containing this transaction in block cahin
        this.blockchain.addBlock({data:validTransactions});

        // broadcast the updated block chain
        this.pubsub.broadcastChain();

        // clear the pool
        this.transactionPool.clear();
    }
}

module.exports = TransactionMiner;