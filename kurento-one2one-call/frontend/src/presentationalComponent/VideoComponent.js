import React from "react";
import ReactPlayer from 'react-player';
import {Row, Col, Grid} from 'react-bootstrap';
import "../CSS/videoElement.css";

export class VideoComponent extends React.Component {
    render () {
        console.log(this.props.url)
        return (
            <div className='videoElement'>
                <Col md={6} md={6}>
                     <ReactPlayer playing = {true} url={this.props.url}  /> 
                </Col>
            </div>
        );
    }
}