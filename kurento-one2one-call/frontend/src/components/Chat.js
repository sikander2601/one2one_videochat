import React from "react";

export class Chat extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            message: '',
            messages: []
        };
    }
    render(){
        return (
            <div className="container">
                <div className="row">
                    <div className="col-4">
                        <div className="card">
                            <div className="card-body">
                                <div className="card-title">Global Chat</div>
                                <hr/>
                                <div className="messages">

                                </div>
                            </div>
                            <div className="card-footer">
                                <br/>
                                <input type="text" placeholder="Message" className="form-control"/>
                                <br/>
                                <button className="btn btn-primary form-control">Send</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}