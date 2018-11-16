import React from "react";
import ReactPlayer from 'react-player';
import {Row, Col, Grid} from 'react-bootstrap';
import "../CSS/videoElement.css";

export class VideoComponent extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            inCall : false
        };
        if(this.props.callState != 0){
            this.setState({incall : true}) 
        }
        else
        this.setState({incall : false})
    }
    render () {
        return (
            <div className='videoElement' style = {{ 'width' : this.state.inCall ? '540px' : '640px' }}>
                <Col md={6} md={6}>
                     <ReactPlayer playing = {true} url={this.props.url}  /> 
                </Col>
            </div>
        );
    }
}