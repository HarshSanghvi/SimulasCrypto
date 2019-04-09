const Block = require('./Block');
const {GENESIS_DATA} = require('../config');
const {GLOBAL_MINE_RATE} = require('../config');
const { cryptoHash } = require('../util');
const hexToBinary = require('hex-to-binary');

describe('Block',() => {
    const timestamp = 2000;
    const hash = 'testhash';
    const lasthash = 'lastHash';
    const data = ['chain','data'];
    const nonce = 1;
    const difficulty = 1;
    const block = new Block({
        timestamp,
        data,
        hash,
        lasthash,
        nonce,
        difficulty
    });

    it('has all parameters applied',() => {
        expect(block.timestamp).toEqual(timestamp);
        expect(block.hash).toEqual(hash);
        expect(block.lasthash).toEqual(lasthash);
        expect(block.data).toEqual(data);
        expect(block.difficulty).toEqual(difficulty);
        expect(block.nonce).toEqual(nonce);
    });

    describe ('genesis()', () => {
        const genesisBlock = Block.genesis();

        it('returns genesis block instance',() => {
            expect(genesisBlock instanceof Block).toBe(true);
        });

        it('returns the genesis data',()=> {
            expect(genesisBlock).toEqual(GENESIS_DATA);
        });
    });

    describe('mineBlock()',()=>{
        const lastBlock = Block.genesis();
        const data = 'minedBlock';
        const mineBlock = Block.mineBlock({lastBlock,data});

        it('returns a block instance',() => {
            expect(mineBlock instanceof Block).toBe(true);
        });

        it('set the `lasthash` to be the `hash` of last block',()=>{
            expect(mineBlock.lasthash).toEqual(lastBlock.hash);
        });

        it('set the `data`',()=>{
            expect(mineBlock.data).toEqual(data);
        });

        it('set the `timestamp`',()=>{
            expect(mineBlock.timestamp).not.toEqual(undefined);
        });

        it('creates correct SHA256 crypto hash based on proper inputs',()=>{
            expect(mineBlock.hash).toEqual(cryptoHash(
                mineBlock.timestamp,
                lastBlock.hash,
                data,
                mineBlock.difficulty,
                mineBlock.nonce
            ));
        });

        it('sets a `hash` that matches difficulty criteria',()=>{
            expect(hexToBinary(mineBlock.hash).substring(0,mineBlock.difficulty)).toEqual('0'.repeat(mineBlock.difficulty));
        });

        it('adjusts the difficulty in mineblock only',()=>{
            const possibleResults = [lastBlock.difficulty + 1, lastBlock.difficulty - 1];
            expect(possibleResults.includes(mineBlock.difficulty)).toBe(true);
        });
    });

    describe('adjustDifficulty()',()=>{
        it('increase difficulty for quickly mined blocks',()=>{
            expect(Block.adjustDifficulty({
                originalBlock : block, timestamp : block.timestamp + GLOBAL_MINE_RATE - 100
            })).toEqual(block.difficulty+1);
        });
        it('decrease difficulty for slowly mined blocks',()=>{
            expect(Block.adjustDifficulty({
                originalBlock : block, timestamp : block.timestamp + GLOBAL_MINE_RATE + 100
            })).toEqual(block.difficulty-1);
        });
        it('has lower limit of 1',()=>{
            block.difficulty = -1;
            expect(Block.adjustDifficulty({originalBlock : block})).toEqual(1);
        });
    });
});
