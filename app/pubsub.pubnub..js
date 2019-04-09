const pubNub = require('pubnub');

const credentials = {
    publishKey: 'pub-c-c929bb70-9ffd-4d66-bcf1-ae06c7a7c78a',
    subscribeKey: 'sub-c-1df65f8e-425d-11e9-929f-425bf52815e4',
    secretKey: 'sec-c-YWVlY2ZhYmMtYWQ0Ny00NDkxLTk1ZWItYjRjZTdlYTFlNWJi'
};

const CHANNELS = {
    TEST : 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN'
}

class PubSub {
    constructor({blockchain}){
        
        this.blockchain = blockchain;

        this.pubnub = new pubNub(credentials);

        this.pubnub.subscribe({channels: Object.values(CHANNELS)});

        this.pubnub.addListener(this.listener());
    }

    listener(){
        return {
            message: messageObject => {
                const {channel,message} = messageObject;
                console.log(`message from server chennel: ${channel} message: ${message}`);
                const parseMessage = JSON.parse(message);

                if(channel===CHANNELS.BLOCKCHAIN){
                    this.blockchain.replaceChain(parseMessage);
                }
            }
        };
    }

    publish({channel,message}){
        this.pubnub.publish({channel,message});
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        })
    }
}

module.exports = PubSub;