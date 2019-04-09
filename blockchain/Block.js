const {GENESIS_DATA, GLOBAL_MINE_RATE} = require('../config');
const { cryptoHash } = require('../util');
const hexToBinary = require('hex-to-binary');

class Block {
    constructor({timestamp,data,hash,lasthash,nonce, difficulty}) {
      this.data = data;
      this.hash = hash;
      this.lasthash = lasthash;
      this.timestamp = timestamp;
      this.nonce = nonce;
      this.difficulty = difficulty;
    }

    static genesis() {
      return new this(GENESIS_DATA);
    }

    static mineBlock({lastBlock, data}) {
      const lasthash = lastBlock.hash;
      let timestamp, hash;
      let {difficulty} = lastBlock;
      let nonce = 0;

      do {
        nonce++;
        timestamp = Date.now();
        difficulty = this.adjustDifficulty({originalBlock : lastBlock, timestamp});
        hash = cryptoHash(timestamp,lasthash,data, nonce, difficulty);
      } while (hexToBinary(hash).substring(0,difficulty) !== '0'.repeat(difficulty));
      
      return new this({timestamp,
      lasthash,
      data,
      hash,
      nonce,
      difficulty
      });
    }

    static adjustDifficulty({originalBlock, timestamp}) {
      const {difficulty} = originalBlock;

      if(difficulty<1) return 1;

      if((timestamp - originalBlock.timestamp) > GLOBAL_MINE_RATE) return difficulty - 1;

      return difficulty + 1;
    }
  }

module.exports = Block;