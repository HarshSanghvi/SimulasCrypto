import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import Transaction from './Transaction';
import history from '../history';

const TRANSACTION_POLL_MS = 10000;

class TransactionPool extends Component {
    state = { transactionPoolMap: {} };

    fetchTransactionPoolMap = () => {
        fetch(`${document.location.origin}/api/transaction-pool-map`)
            .then(response => response.json())
            .then(json => this.setState({ transactionPoolMap: json }));
      }

    componentDidMount() {
        this.fetchTransactionPoolMap();

        this.fetchTransactionPoolMapInterval = setInterval(()=>this.fetchTransactionPoolMap(),TRANSACTION_POLL_MS);
    }

    componentWillUnmount() {
        clearInterval(this.fetchTransactionPoolMapInterval);
    }

    fetchMineTransactions = () => {
        fetch(`${document.location.origin}/api/mine-transactions`)
            .then(response => {
                if(response.status === 200) {
                    alert("success");
                    history.push('/blocks');
                } else {
                alert("failed to mine transaction");
                }
            });
    }

    render() {
        return (
            <div className='TransactionPool'>
                <div>
                    <Link to='/'>Home</Link>
                </div>
                <h3>Transaction Pool</h3>
                {
                    Object.values(this.state.transactionPoolMap).map(transaction => {
                        return (
                            <div key={transaction.id}><hr /><Transaction transaction={transaction} /></div>
                        )
                    })
                }
                <hr />
                <Button bsStyle="danger" onClick={this.fetchMineTransactions}>Mine the Transaction</Button>
            </div>
        )
    }
}

export default TransactionPool;