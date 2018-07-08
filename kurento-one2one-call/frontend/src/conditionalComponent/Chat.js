    import React from "react";
    import { Button,ButtonGroup,ButtonToolbar } from "react-bootstrap";
    import "../CSS/chat.css";
export class Chat extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            message: '',
            messages: []
        };
    }
    openChat = () => {

    }
    render(){
        return (
            <div className="chatDiv">
                <Button className = 'buttonElement' onClick = {this.openChat} >Chat</Button>
                <div class="chat-content">
                
                </div>
            </div>
        );
    }
}