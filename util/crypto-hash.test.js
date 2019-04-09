const cryptoHash = require('./crypto-hash');

describe('cryptoHash()',()=>{

    it('function generates SHA-256 hash output',() => {
        expect(cryptoHash('foo')).toEqual('b2213295d564916f89a6a42455567c87c3f480fcd7a1c15e220f17d7169a790b'.toLowerCase());
    });

    it('produces same hash with same arguments in any order',() => {
        expect(cryptoHash('one','two','three')).toEqual(cryptoHash('two','one','three'));
    });

    it('creates new hash when object data gets changed',()=>{
        const test = {}
        const originalHash = cryptoHash(test);
        test['a'] = 'a';

        expect(cryptoHash(test)).not.toEqual(originalHash);
    });
});