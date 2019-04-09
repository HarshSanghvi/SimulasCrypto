const redis = require('redis');

const CHANNELS = {
  TEST: 'TEST',
  BLOCKCHAIN: 'BLOCKCHAIN',
  TRANSACTION: 'TRANSACTION'
};

class PubSub {
    constructor({ blockchain, transactionPool, redisURL }) {
      this.blockchain = blockchain;
      this.transactionPool = transactionPool;

      this.publisher = redis.createClient(redisURL);
      this.subscriber = redis.createClient(redisURL);
  
      this.subscribeToChannels();
  
      this.subscriber.on(
        'message',
        (channel, message) => this.handleMessage(channel, message)
      );
    }

    handleMessage(channel, message) {
        console.log(`Message received. Channel: ${channel}. Message: ${message}.`);
    
        const parseMessage = JSON.parse(message);

        switch(channel){
          case CHANNELS.BLOCKCHAIN:
            this.blockchain.replaceChain(parseMessage, true, () => {
              this.transactionPool.clearBlockchainTransaction({
                chain:parseMessage
              })
            });
            break;
          case CHANNELS.TRANSACTION:
            this.transactionPool.setTransaction(parseMessage);
            break;
          default:
            return;
        }
    }

    subscribeToChannels() {
        Object.values(CHANNELS).forEach(channel => {
          this.subscriber.subscribe(channel);
        });
    }

    publish({ channel, message }) {
        this.subscriber.unsubscribe(channel, () => {
          this.publisher.publish(channel, message, () => {
            this.subscriber.subscribe(channel);
          });
        });
    }

    broadcastChain() {
        this.publish({
          channel: CHANNELS.BLOCKCHAIN,
          message: JSON.stringify(this.blockchain.chain)
        });
    }

    broadcastTransaction({transaction}) {
      this.publish({
        channel: CHANNELS.TRANSACTION,
        message: JSON.stringify(transaction)
      });
  }
}

module.exports = PubSub;