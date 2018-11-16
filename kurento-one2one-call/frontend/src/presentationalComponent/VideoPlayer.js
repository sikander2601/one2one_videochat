import React from "react";
import { VideoComponent } from './VideoComponent';
import '../CSS/videoComponent.css';

export class VideoPlayer extends React.Component {
    constructor(props){
        super(props)
        console.log("In player");
        console.log(props);
    }
    render () {
        let urlList = this.props.urls;
        let callState = this.props.callState;
        console.log('urlList ', urlList);
        if(urlList!==null){
            console.log('ok')
        let vc = urlList.map(function(link){
            console.log(link);
            return( <VideoComponent url = {link}  callState = {callState} />);
        });
            return (
            <div className='player'>
                {vc}
            </div>
        );
    }
           
    }
}