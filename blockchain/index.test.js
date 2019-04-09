const Blockchain = require('.');
const Block = require('./Block');
const { cryptoHash } = require('../util');
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');

describe('Blockchain',() => {

    let blockChain, newChain, originalChain, errorMock;

    beforeEach(()=>{
        errorMock = jest.fn();
        blockChain = new Blockchain();
        newChain = new Blockchain();
        originalChain = blockChain.chain;
        global.console.error = errorMock;
    });

    it('contains array for block chain',() => {
        expect(blockChain.chain instanceof Array).toBe(true);
    });

    it('starts with `genesis` block',() => {
        expect(blockChain.chain[0]).toEqual(Block.genesis());
    });

    it('adds new block to block chain',() => {
        const data = 'test block';
        blockChain.addBlock ({data});

        expect(blockChain.chain[blockChain.chain.length - 1].data).toEqual(data);
    });

    describe('isValidChain()',() => {
        describe('chain does not start with `genesis` block',() => {
            it('returns false',()=>{
                blockChain.chain[0] = {data:'fake-genesis'};

                expect(Blockchain.isValidChain(blockChain.chain)).toBe(false);
            });
        });
        describe('chain does start with `genesis` block and has multiple blocks',() => {

            beforeEach(()=>{
                blockChain.addBlock({data:'apple'});
                blockChain.addBlock({data:'orange'});
                blockChain.addBlock({data:'pineapple'});
            });

            describe('last hash refrence has changed',()=>{
                it('returns false',()=>{
                    blockChain.chain[2].lasthash = 'broken hash';

                    expect(Blockchain.isValidChain(blockChain.chain)).toBe(false);
                });
            });
            describe('data has been tampered with',()=>{
                it('returns false',()=>{
                    blockChain.chain[2].data = 'broken data';

                    expect(Blockchain.isValidChain(blockChain.chain)).toBe(false);
                });
            });
            describe('has jumped difficulty block',()=>{
                it('returns false',()=>{
                    const lastBlock = blockChain.chain[blockChain.chain.length-1];
                    const lastHash = lastBlock.hash;
                    const timestamp = Date.now();
                    const nonce = 0;
                    const difficulty = lastBlock.difficulty - 3;
                    const data = [];

                    const hash = cryptoHash(lastHash, timestamp, nonce, difficulty, data);

                    const badBlock = new Block({timestamp,data, hash, lasthash: lastHash, nonce, difficulty});
                    blockChain.chain.push(badBlock);
                    expect(Blockchain.isValidChain(blockChain.chain)).toBe(false);
                });
            });
            describe('fully valid chain',() => {
                it('returns true',()=>{
                    expect(Blockchain.isValidChain(blockChain.chain)).toBe(true);
                });
            });
        });
    });

    describe('replaceChain()',() => {

        let logMock;
        beforeEach(()=>{
            logMock = jest.fn();
            global.console.log = logMock;
        });

        describe('when the new chain is not longer',()=>{

            beforeEach(()=>{
                newChain.chain[0] = { new:'chain' };
                blockChain.replaceChain(newChain.chain);
            });

            it('does not replace chain',()=>{
                expect(blockChain.chain).toEqual(originalChain);
            });

            it('logs an error message',()=>{
                expect(errorMock).toHaveBeenCalled();
            });
        });
        describe('when chain is longer',()=>{
            beforeEach(() => {
                newChain.addBlock({data:'apple'});
                newChain.addBlock({data:'orange'});
                newChain.addBlock({data:'pineapple'});
            });

            describe('when new chain is invalid',()=>{
                
                beforeEach(()=>{
                    newChain.chain[2].lasthash = 'test-hash';
                    blockChain.replaceChain(newChain.chain);
                });

                it('does not replace chain',()=>{
                    expect(blockChain.chain).toEqual(originalChain);
                });

                it('logs an error message',()=>{
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('when new chain is valid',()=>{

                beforeEach(()=>{
                    blockChain.replaceChain(newChain.chain);
                });

                it('does replace chain',()=>{
                    expect(blockChain.chain).toEqual(newChain.chain);
                });

                it('logs replaced chain',()=>{
                    expect(logMock).toHaveBeenCalled();
                });
            });
        });
        describe('and `validateTransaction` flag is true',()=>{
            it('calls validateTransactionData()',()=>{
                const validateTransactionMock = jest.fn();

                blockChain.validateTransactionData = validateTransactionMock;

                newChain.addBlock({data:'testing'});
                blockChain.replaceChain(newChain.chain,true);

                expect(validateTransactionMock).toHaveBeenCalled();
            });
        });
    });

    describe('validateTransactionData()',()=>{
        let rewardTransaction, wallet, nextTransaction;

        beforeEach(()=>{
            wallet = new Wallet();
            nextTransaction = wallet.createTransaction({
                amount:50,
                receipient:'test-receipient'
            });
            rewardTransaction = Transaction.rewardTransaction({
                minerWallet:wallet
            });
        });

        describe('when transaction data is valid',()=>{
            it('returns true',()=>{
                newChain.addBlock({ data: [nextTransaction, rewardTransaction]});

                expect(blockChain.validateTransactionData({chain:newChain.chain})).toBe(true);
                expect(errorMock).not.toHaveBeenCalled();
            });
        });

        describe('when transaction data has multiple rewards',()=>{
            it('returns false and logs an error',()=>{
                newChain.addBlock({ data: [nextTransaction, rewardTransaction, rewardTransaction]});

                expect(blockChain.validateTransactionData({chain:newChain.chain})).toBe(false);
                expect(errorMock).toHaveBeenCalled();
            });
        });

        describe('when transaction data at least one malformed output data',()=>{
            describe('when transaction is not reward transaction',()=>{
                it('returns false and logs an error',()=>{
                    nextTransaction.outputMap[wallet.publicKey] = 989898;

                    newChain.addBlock({ data: [nextTransaction, rewardTransaction]});

                    expect(blockChain.validateTransactionData({chain:newChain.chain})).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('when transaction is reward transaction',()=>{
                it('returns false and logs an error',()=>{
                    rewardTransaction.outputMap[wallet.publicKey] = 989898;

                    newChain.addBlock({ data: [nextTransaction, rewardTransaction]});

                    expect(blockChain.validateTransactionData({chain:newChain.chain})).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });

        describe('and the transaction data has at least one malformed input',()=>{
            it('returns false and logs an error',()=>{
                wallet.balance = 9000;

                const outputMapVar = {
                    [wallet.publicKey] : 8900,
                    testreceipient : 100
                };

                const badTransaction = {
                    input:{
                        timestamp:Date.now(),
                        amount:wallet.balance,
                        address:wallet.publicKey,
                        signature:wallet.sign(outputMapVar)
                    },
                    outputMap:outputMapVar
                };

                newChain.addBlock({data:[badTransaction, rewardTransaction]});

                expect(blockChain.validateTransactionData({chain:newChain.chain})).toBe(false);
                expect(errorMock).toHaveBeenCalled(); 
            });
        });

        describe('and a block contains multiple idetical transactions',()=>{
            it('returns false and logs an error',()=>{
                newChain.addBlock({data:[nextTransaction, nextTransaction, nextTransaction, rewardTransaction]});

                expect(blockChain.validateTransactionData({chain:newChain.chain})).toBe(false);
                expect(errorMock).toHaveBeenCalled();                 
            });
        });
    });
});