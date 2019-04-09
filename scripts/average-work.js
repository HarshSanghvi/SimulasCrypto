const Blockchain = require('../blockchain');

const blockchain = new Blockchain();

blockchain.addBlock({data:'intial data'});

console.log("add block ",blockchain.chain[blockchain.chain.length-1]);

let nextBlock, timediff, nextTimestamp, prevTimestamp, average;

let times = [];

for(let i=0; i<=10; i++) {
    prevTimestamp = blockchain.chain[blockchain.chain.length-1].timestamp;

    blockchain.addBlock({data: `block ${i}`});

    nextBlock = blockchain.chain[blockchain.chain.length-1];

    nextTimestamp = nextBlock.timestamp;
    timediff = nextTimestamp - prevTimestamp;
    times.push(timediff);

    average = times.reduce((total,num) => (total+num))/times.length;

    console.log(`Time to mine block : ${timediff} ms. New difficulty is : ${nextBlock.difficulty}. average time for mining blocks ${average} ms.`);
}