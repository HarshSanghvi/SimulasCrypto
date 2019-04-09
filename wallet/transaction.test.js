const Transaction = require('./transaction');
const Wallet = require('./index');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

describe('Transaction',()=>{

    let transaction, receipient, senderWallet, amount;

    beforeEach(()=>{
        senderWallet = new Wallet();
        amount = 50;
        receipient = 'test-receipient';

        transaction = new Transaction({senderWallet, receipient, amount});
    });

    it('has an `id`',()=>{
        expect(transaction).toHaveProperty('id');
    });

    describe('outputMap',()=>{
        it('has an `outputMap`',()=> {
            expect(transaction).toHaveProperty('outputMap');
        });

        it('outputs `amount` to the `receipient`',()=>{
            expect(transaction.outputMap[receipient]).toEqual(amount);
        });

        it('outputs the remaining balance in `senderWallet`',()=>{
            expect(transaction.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance - amount);
        });
    });

    describe('input',()=>{
        it('has a `input`',()=>{
            expect(transaction).toHaveProperty('input');
        });

        it('has a `timestamp`',()=>{
            expect(transaction.input).toHaveProperty('timestamp');
        });

        it('has `amount` to the `senderWallet` balance',()=>{
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });

        it('has `address` to the `senderWallet` publicKey',()=>{
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });

        it('signs the `input`',()=>{
            expect(verifySignature({
                    publicKey:senderWallet.publicKey,
                    data:transaction.outputMap,
                    signature: transaction.input.signature
                })
            ).toBe(true);
        });
    });

    describe('validateTransaction()',()=>{

        let errorMock;

        beforeEach(()=>{
            errorMock = jest.fn();

            global.console.error = errorMock;
        });

        describe('when transaction is valid',()=>{
            it('returns true',()=>{
                expect(Transaction.validateTransaction(transaction)).toBe(true);
            })
        });

        describe('when transaction is invalid',()=>{
            describe('it has a fraudulent `outputMap` values',()=>{
                it('returns false and error logs called',()=>{
                    transaction.outputMap[senderWallet.publicKey] = 99909090909;

                    expect(Transaction.validateTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                })
            });

            describe('it has a fraudulent `signature`',()=>{
                it('returns false and error logs called',()=>{
                    transaction.input.signature = new Wallet().sign('data');
                    
                    expect(Transaction.validateTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                })
            });
        });
    });

    describe('update()',()=>{

        let originalSignature, originalOutput, nextReceipient, nextAmount;

        describe('In case when the amount exceeds balance',()=>{
            it('throws an error',()=>{
                expect(()=>transaction.update({
                    senderWallet, receipient: 'test-receipient', amount: 9999999
                })).toThrow('amount exceeds balance');
            });
        });

        describe('In case when the amount is valid',()=>{
            beforeEach(()=>{
                originalSignature = transaction.input.signature;
                originalOutput = transaction.outputMap[senderWallet.publicKey];
                nextReceipient = 'next-receipient';
                nextAmount = 50;
    
                transaction.update({
                    senderWallet, receipient: nextReceipient, amount: nextAmount
                });
            });
    
            it('outputs the amount to the next receipient',()=>{
                expect(transaction.outputMap[nextReceipient]).toEqual(nextAmount);
            });
    
            it('subtracts amount from the original sender output amount',()=>{
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalOutput - nextAmount);
            }); 
    
            it('maintains a total output that matches input amount',()=>{
                expect(Object.values(transaction.outputMap).reduce((total, outputAmount)=>total+outputAmount)).toEqual(transaction.input.amount);
            });
    
            it('re-signs the whole transaction',()=>{
                expect(transaction.input.signature).not.toEqual(originalSignature);
            });

            describe('Add another payment for the same receipient',() => {
                let addedAmount;

                beforeEach(()=>{
                  addedAmount = 80;
                  transaction.update({
                    senderWallet, receipient: nextReceipient, amount: addedAmount
                    });
                });

                it('adds the additional amount to receipient',()=>{
                    expect(transaction.outputMap[nextReceipient]).toEqual(nextAmount + addedAmount);
                });

                it('subtracts amount from the original sender output amount',()=>{
                    expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalOutput - (nextAmount+addedAmount));
                });
            });
        });
    });

    describe('rewardTransaction()',()=>{
        let rewardTransaction, minerWallet;

        beforeEach(()=>{
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({minerWallet});
        });

        it('creates transaction with reward input',()=>{
            expect(rewardTransaction.input).toEqual(REWARD_INPUT);
        });

        it('creates transaction with mining reward',()=>{
            expect(rewardTransaction.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
        });
    });
});