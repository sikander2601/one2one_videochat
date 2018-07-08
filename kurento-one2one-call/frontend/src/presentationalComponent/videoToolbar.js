import React from "react";
import { Button,ButtonGroup,ButtonToolbar } from "react-bootstrap";
import '../CSS/toolbar.css';


export class VideoToolbar extends React.Component {
    render(){
        return (
            <div className='videoToolbar'>
                <ButtonToolbar>
                    <ButtonGroup bsSize="big" className = 'buttonGroup'>
                        <Button className = 'buttonElement'>Mic Off</Button>
                        <Button className = 'buttonElement'>Camera Off</Button>
                        <Button className = 'buttonElement'>Share Screen</Button>
                        <Button className = 'buttonElement'>Leave</Button>
                    </ButtonGroup>
                </ButtonToolbar>
                <div className='chat'>

                </div>
            </div>
        );
    }
}

