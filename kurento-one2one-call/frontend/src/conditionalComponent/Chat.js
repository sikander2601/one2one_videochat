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
            show : this.props.show
        };
    }
    
    sendChat = () =>{
        var msg = document.getElementsByClassName('form-control').value;
        Home.sendChat(msg);
    }

    openChat = () => {
        
        var temp = this.state.show;
        this.setState({show: !temp});
    }

    render(){
        return (
            <div className= "chat">
            <div className="chatDiv" style={{ visibility : this.state.show ? 'visible' :'hidden' }}>
                <div class="chat-content"  >
                    <div className="card-title"> Chat</div>
                    <hr/>
                    <div className="messages">
                    </div>
                    <div className="footer">
                        <br/>
                        <input type="text" placeholder="Message" className="form-control" value={this.state.message} onChange={ev => this.setState({message: ev.target.value})}/>
                        <button className="btn btn-primary form-control" onClick= {this.sendChat} >Send</button>
                    </div>      
                </div>   
            </div>
            <div className= "chatButton">
            <Button className = 'buttonElement' onClick = {this.chatBox} >Chat</Button>
            </div>  
        </div>
           
        );
    }
}

