const GLOBAL_MINE_RATE = 200;
const INITIAL_DIFF = 3;

const GENESIS_DATA = {
    timestamp : 2000,
    lasthash : ' ---- ',
    hash : 'newhash',
    data : [],
    nonce : 0,
    difficulty : INITIAL_DIFF
};

const STARTING_BALANCE = 1000;

const REWARD_INPUT = {address:'*Miner-reward*'};

const MINING_REWARD = 50;

module.exports = {GENESIS_DATA, GLOBAL_MINE_RATE, STARTING_BALANCE, REWARD_INPUT, MINING_REWARD};