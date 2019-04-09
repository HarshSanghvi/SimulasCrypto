const bodyParser = require('body-parser');
const express = require('express');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const path = require('path');
const request = require('request');
const TransactionPool = require('./wallet/transaction-pool');
const Wallet = require('./wallet');
const TransactionMiner = require('./app/transaction-miner');

const DEF_PORT = 3000;
let PEER_PORT;

const isDevelopment = process.env.ENV === 'development';

const ROOT_NODE_ADDRESS = `http://localhost:${DEF_PORT}`;

const REDIS_URL = isDevelopment ? 'redis://127.0.0.1:6379' : 'redis://h:p24fa9844b4de2004a3ce0625a9712a83cf220c2e78c944505fb781d161019ffc@ec2-18-214-170-171.compute-1.amazonaws.com:17019';

if(process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEF_PORT + Math.ceil(Math.random()*1000);
}

const app = express();
const blockChain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({blockchain: blockChain, transactionPool, redisURL : REDIS_URL});
const transactionMiner = new TransactionMiner({blockchain:blockChain,transactionPool,wallet,pubsub});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'client/dist')))

app.get('/api/blocks',(req,res)=>{
    res.json(blockChain.chain);
});

app.get('/api/transaction-pool-map',(req,res)=>{
    res.json(transactionPool.transactionMap);
});

app.get('/api/mine-transactions',(req,res)=>{
    transactionMiner.mineTransaction();

    res.redirect('/api/blocks');
});

app.get('/api/wallet-info',(req,res)=>{
    const address = wallet.publicKey;
    res.json({address, balance : Wallet.calculateBalance({
        address, chain:blockChain.chain
    })});
});

app.get('*',(req,res)=>{
    res.sendfile(path.join(__dirname,'client/dist/index.html'));
});

app.post('/api/mine',(req,res)=>{
    const {data} = req.body;
    blockChain.addBlock({data});
    pubsub.broadcastChain();
    res.redirect('/api/blocks');
});

app.post('/api/transact',(req, res) => {
    const {receipient, amount} = req.body;

    let transaction = transactionPool.existingTransaction({inputAddress: wallet.publicKey});

    try{
        if(transaction)
            transaction.update({senderWallet: wallet, receipient,amount});
        else
            transaction = wallet.createTransaction({receipient, amount, chain: blockChain.chain});
    } catch(error) {
        return res.status(400).json({type:'error',message:error.message});
    }

    transactionPool.setTransaction(transaction);

    pubsub.broadcastTransaction({transaction});

    res.json({type:'success',transaction});
});

if(isDevelopment) {
    const walletOne = new Wallet();
    const walletTwo = new Wallet();

    const generateWalletTransactions = ({wallet, receipient, amount}) => {
        const transaction = wallet.createTransaction({amount, receipient, chain: blockChain.chain});
        transactionPool.setTransaction(transaction);
    }

    const walletAction = () => generateWalletTransactions({
        wallet, receipient: walletOne.publicKey, amount: 5
    });

    const walletOneAction = () => generateWalletTransactions({
        wallet:walletOne, receipient: walletTwo.publicKey, amount: 15
    });

    const walletTwoAction = () => generateWalletTransactions({
        wallet:walletTwo, receipient: wallet.publicKey, amount: 25
    });

    for (let i =0 ;i<10; i++) {
        if(i%3==0) {
            walletAction();
            walletOneAction();
        } else if (i%3==1) {
            walletOneAction();
            walletTwoAction();
        } else {
            walletTwoAction();
            walletAction();
        }
        transactionMiner.mineTransaction();
    }
}

const syncWithRoot = () => {
    request({url: `${ROOT_NODE_ADDRESS}/api/blocks`},(error, response, body)=>{
        if(!error && response.statusCode == 200) {
            const rootChain = JSON.parse(body);
            console.log('replace a chain with synced root chain',rootChain);
            blockChain.replaceChain(rootChain);
        }
    });

    request({url: `${ROOT_NODE_ADDRESS}/api/transaction-pool-map`},(error, response, body)=>{
        if(!error && response.statusCode == 200) {
            const rootTransactionPool = JSON.parse(body);
            console.log('replace a transaction pool map with synced root transaction pool map',rootTransactionPool);
            transactionPool.setMap(rootTransactionPool);
        }
    });
};

const PORT = process.env.PORT || PEER_PORT || DEF_PORT;

app.listen(PORT,() => {
    console.log(`listening on ${PORT}`)
    if(PORT!==DEF_PORT) {
        syncWithRoot();
    }
});

