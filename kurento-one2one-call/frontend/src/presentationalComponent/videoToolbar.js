import React from "react";
import { Button,ButtonGroup,ButtonToolbar, Grid } from "react-bootstrap";
import '../CSS/toolbar.css';
import {Chat} from '../conditionalComponent/Chat';


export class VideoToolbar extends React.Component {
    
    constructor(props){
        super(props);

        this.state = {
            message: '',
            messages: [],
            show : true
        };
    }
    
    openChat = () => {
        
        var temp = this.state.show;
        this.setState({show: !temp});
    }
    render(){
        return (
            
            <Grid fluid>
            <div className='chatDiv' style = {{visibility: this.state.show ? 'hidden' : 'visible' }} >
                                <Chat />
                            </div>
            <div className='videoToolbar'>
                <ButtonToolbar>
                    <ButtonGroup bsSize="big" className = 'buttonGroup'>
                        <Button className = 'buttonElement'>Mic Off</Button>
                        <Button className = 'buttonElement'>Camera Off</Button>
                        <Button className = 'buttonElement'>Share Screen</Button>
                        <Button className = 'buttonElement'>Leave</Button>
                        
                    </ButtonGroup>

                    <div className= "chatButton">
                            <Button className = 'buttonElement' style = {{visibility: this.state.show ? 'visible' : 'hidden' }} onClick = {this.openChat} >Chat</Button>
                    </div>
                </ButtonToolbar>
            </div>
            
            </Grid>
            
        );
    }
}

