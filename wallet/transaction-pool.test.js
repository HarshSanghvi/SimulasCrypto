const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain');

describe('TransactionPool',()=>{
    let transaction, transactionPool, senderWallet;

    beforeEach(()=>{
        transactionPool = new TransactionPool();
        senderWallet = new Wallet();
        transaction = new Transaction({senderWallet,amount:50,receipient:'test-receipient'});
    });

    describe('setTransaction()',()=>{
        it('adds a transaction',()=>{
            transactionPool.setTransaction(transaction);
            expect(transactionPool.transactionMap[transaction.id]).toBe(transaction);
        });
    });

    describe('existingTransaction()',()=>{
        it('returns an existing transaction given an input address',()=>{
            transactionPool.setTransaction(transaction);
            expect(transactionPool.existingTransaction({inputAddress:senderWallet.publicKey})).toBe(transaction);
        });
    });

    describe('validTransactions()',()=>{
        let validTransactions, errorMock;

        beforeEach(()=>{
            validTransactions = [];
            errorMock = jest.fn();
            global.console.error = errorMock;

            for (let i=0;i<10;i++){
                transaction = new Transaction({senderWallet,receipient:'new-receipient',amount:40});

                if(i%3===0) {
                    transaction.input.amount = 99999;
                } else if (i%3===1) {
                    transaction.input.signature = new Wallet().sign('test');
                } else {
                    validTransactions.push(transaction);
                }
                transactionPool.setTransaction(transaction);
            }
        });

        it('returns valid transactions',()=>{
            expect(transactionPool.validTransactions()).toEqual(validTransactions);
        });

        it('logs error for transactions',()=>{
            transactionPool.validTransactions();
            expect(errorMock).toHaveBeenCalled();
        });
    });

    describe('clear()',()=>{
        it('clears the transaction pool',()=>{
            transactionPool.clear();

            expect(transactionPool.transactionMap).toEqual({});
        })
    });

    describe('clearBlockchainTransaction()',()=>{
        it('clears pool for specific blockchain trasnactions',()=>{
            const blockchain = new Blockchain();
            const expectedTransactionMap = {};

            for(let i=0;i<6;i++) {
                transaction = new Transaction({senderWallet:new Wallet(),receipient:'test-receipient',amount:30});

                transactionPool.setTransaction(transaction);

                if(i%2 === 0) {
                    blockchain.addBlock({data: [transaction]});
                } else {
                    expectedTransactionMap[transaction.id] = transaction;
                }
            }

            transactionPool.clearBlockchainTransaction({chain:blockchain.chain});
            expect(transactionPool.transactionMap).toEqual(expectedTransactionMap);
        });
    });
});