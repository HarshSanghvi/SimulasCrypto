const Wallet = require('./index.js');
const Transaction = require('./transaction');
const { verifySignature } = require('../util');
const Blockchain = require('../blockchain');
const { STARTING_BALANCE } = require('../config');

describe('Wallet',()=>{
    let wallet;

    beforeEach(()=>{
        wallet = new Wallet();
    });

    it('has a `balance`',()=>{
        expect(wallet).toHaveProperty('balance');
    });

    it('has a `publicKey`',()=>{
        expect(wallet).toHaveProperty('publicKey');
    });

    describe('signing data',()=>{
        const data = 'test-data';

        it('verifies the valid signature',()=>{
            expect(
                verifySignature({
                    data,
                    publicKey: wallet.publicKey,
                    signature: wallet.sign(data)
                })
            ).toBe(true);
        });

        it('does not verify invalid signature',()=>{
            expect(
                verifySignature({
                    data,
                    publicKey: wallet.publicKey,
                    signature: new Wallet().sign(data)
                })
            ).toBe(false);
        });
    });

    describe('createTransaction()',()=>{
        describe('In case when the amount exceeds balance',()=>{
            it('throws an error',()=>{
                expect(()=>wallet.createTransaction({amount: 999999, receipient: 'test-receipient'})).toThrow('amount exceeds balance');
            });
        });
        describe('In case when the amount is valid',()=>{

            let transaction, amount, receipient;

            beforeEach(()=>{

                amount = 50;
                receipient = 'test-receipient'

                transaction = wallet.createTransaction({amount, receipient});
            });

            it('creates an instance of `Transaction`',()=>{
                expect(transaction instanceof Transaction).toBe(true);
            });

            it('matches transaction input with wallet',()=>{
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });

            it('outputs receipient with amount',()=>{
                expect(transaction.outputMap[receipient]).toEqual(amount);
            });
        });
        describe('and a chain is passed',()=>{
            it('calls `Wallet.calculateBalance()` method',()=>{
                const calculateBalanceMock = jest.fn();
                const originalCalculateBalance = Wallet.calculateBalance;

                Wallet.calculateBalance = calculateBalanceMock;

                wallet.createTransaction({
                    amount:20,
                    receipient:'test',
                    chain: new Blockchain().chain
                });

                expect(calculateBalanceMock).toHaveBeenCalled();

                Wallet.calculateBalance = originalCalculateBalance;
            });
        });
    });

    describe('calculateBalance()',()=>{

        let blockchain;

        beforeEach(()=>{
            blockchain = new Blockchain();
        });

        describe('and there are no outputs for the wallet',()=>{
            it('returns the `STARTING_BALNCE`',()=>{
                expect(Wallet.calculateBalance({
                    chain:blockchain.chain,
                    address:wallet.publicKey
                })).toEqual(STARTING_BALANCE);
            });
        });

        describe('and there are outputs for the wallet',()=>{
            let transactionOne, transactionTwo;

            beforeEach(()=>{
                transactionOne = new Wallet().createTransaction({
                    amount:50,
                    receipient:wallet.publicKey
                });

                transactionTwo = new Wallet().createTransaction({
                    amount:20,
                    receipient:wallet.publicKey
                });

                blockchain.addBlock({data:[transactionOne, transactionTwo]});
            });

            it('adds sum of the total amount from all respective transactions',()=>{
                expect(Wallet.calculateBalance({
                    chain:blockchain.chain,
                    address:wallet.publicKey})).toEqual(STARTING_BALANCE+
                    transactionOne.outputMap[wallet.publicKey] + transactionTwo.outputMap[wallet.publicKey]);
            });

            describe('wallet has made a recent transaction',()=>{
                let recentTransaction;

                beforeEach(()=>{
                    recentTransaction = wallet.createTransaction({
                        receipient:'test',
                        amount:40
                    });

                    blockchain.addBlock({data:[recentTransaction]});
                });

                it('returns recent transaction output amount as balance',()=>{
                    expect(Wallet.calculateBalance({
                        chain:blockchain.chain,
                        address:wallet.publicKey
                    })).toEqual(recentTransaction.outputMap[wallet.publicKey]);
                });

                describe('if we have transaction after the recent transaction',()=>{
                    let sameBlockTransaction, nextBlockTransaction;

                    beforeEach(()=>{
                        recentTransaction = wallet.createTransaction({
                            receipient:'test-recent',
                            amount:50
                        });

                        sameBlockTransaction = Transaction.rewardTransaction({minerWallet:wallet});

                        blockchain.addBlock({data: [recentTransaction, sameBlockTransaction]});

                        nextBlockTransaction = new Wallet().createTransaction({
                            receipient:wallet.publicKey,
                            amount:80
                        });

                        blockchain.addBlock({data:[nextBlockTransaction]});
                    });

                    it('includes output amount in the returned balance',()=>{
                        expect(Wallet.calculateBalance({
                            chain:blockchain.chain,
                            address:wallet.publicKey
                        })).toEqual(recentTransaction.outputMap[wallet.publicKey]+
                        nextBlockTransaction.outputMap[wallet.publicKey]+
                    sameBlockTransaction.outputMap[wallet.publicKey]);
                    });
                });
            });
        });
    });
});