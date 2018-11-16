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
    

    render(){
        return (
            
            <Grid fluid>
            
            <div className='videoToolbar'>
                <ButtonToolbar>
                    <ButtonGroup bsSize="big" className = 'buttonGroup'>
                        <Button className = 'buttonElement'>Mic Off</Button>
                        <Button className = 'buttonElement'>Camera Off</Button>
                        <Button className = 'buttonElement'>Share Screen</Button>
                        <Button className = 'buttonElement'>Leave</Button>
                        
                    </ButtonGroup>     
                </ButtonToolbar>
            </div>
            
            </Grid>
            
        );
    }
}

