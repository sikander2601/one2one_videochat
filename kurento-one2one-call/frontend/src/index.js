    import React from 'react';
    import ReactDOM from 'react-dom';
    import { BrowserRouter, Route } from 'react-router-dom';
    import 'bootstrap/dist/css/bootstrap.css';
    //import 'bootstrap/dist/css/bootstrap-theme.css';
    import { Head } from "./presentationalComponent/Head";
    import { Home } from "./conditionalComponent/Home";
    import { VideoToolbar } from "./presentationalComponent/videoToolbar";
    import './CSS/container.css';
import { Chat } from './conditionalComponent/Chat';

    class App extends React.Component {

        render(){
            return(
              <div className="mainPage">
                  <BrowserRouter>
                      <div className='content-Wrapper'>
                        <div className='content-Header'>
                          <Head/>
                        </div>
                        <div className='content-Body'>
                            {/*<Route path="/webinar1/player" component={videoPlayer} />*/}
                            <Route exact path="/webinar/:webinarId/:profileId" component={Home} />
                        </div>
                        <div className='content-Toolbar'>
                            <VideoToolbar/>
                        </div>
                        <div className='chat'>
                            <Chat/>
                        </div>
                      </div>
                  </BrowserRouter>
              </div>
            );
        }
    }
    ReactDOM.render(<App/>,document.getElementById("root"));
