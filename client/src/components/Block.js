import React, { Component } from 'react'
import { Button } from 'react-bootstrap'
import Transaction from './Transaction';


class Block extends Component {
    state = {
        displayTransaction:false
    }

    toggleTransaction = () => {
        this.setState({displayTransaction : !this.state.displayTransaction});
    }

    get displayTransaction() {
        const { data } = this.props.block;

        const stringifyData = JSON.stringify(data);

        const dataDisplay = stringifyData.length > 35 ? `${stringifyData.substring(0,35)}...` : stringifyData;

        if(this.state.displayTransaction) {
            return (
                <div>
                    {
                        data.map(transaction => (
                            <div key={transaction.id}>
                                <hr />
                                <Transaction transaction={transaction}/>
                            </div>
                        ))
                    }
                    <br />
                    <Button bsSize="small" bsStyle="danger" onClick={this.toggleTransaction}>Show Less...</Button>
                </div>
                );
        }

        return (
        <div>
            <div>Data: {dataDisplay}</div>
            <Button bsSize="small" bsStyle="danger" onClick={this.toggleTransaction}>Show More...</Button>
        </div>
        );
    }

    render() {
        const { timestamp, hash } = this.props.block;

        const hashDisplay = `${hash.substring(0,15)}...`;

        return (
            <div className='Block'>
                <div>Timestamp: {new Date(timestamp).toLocaleString()}</div>
                <div>Hash: {hashDisplay}</div>
                {this.displayTransaction}
            </div>
        );
    }
}

export default Block;