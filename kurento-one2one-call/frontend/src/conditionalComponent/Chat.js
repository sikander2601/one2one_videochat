    import React from "react";
    import { Button,ButtonGroup,ButtonToolbar } from "react-bootstrap";
    import "../CSS/chat.css";
    import {Home} from "./Home.js";

export class Chat extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            message: '',
            messages: [],
            show : false
        };
    }
    
    sendChat = () =>{
        var msg = document.getElementsByClassName('form-control').value;
        Home.sendChat(msg);
    }

    render(){
        return (
            <div className="chatDiv">
                <div class="chat-content">
                    <div className="card-title">Global Chat</div>
                    <hr/>
                    <div className="messages">
                    </div>
                    <div className="footer">
                        <br/>
                        <input type="text" placeholder="Message" className="form-control" value={this.state.message} onChange={ev => this.setState({message: ev.target.value})}/>
                        <br/>
                        <button className="btn btn-primary form-control" onClick= {this.sendChat} >Send</button>
                    </div>      
                </div>
            </div>
        );
    }
}

