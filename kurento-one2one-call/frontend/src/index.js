    import React from 'react';
    import ReactDOM from 'react-dom';
    import { BrowserRouter, Route } from 'react-router-dom';
    //import { Grid, Row, Alert, Col, Tab, Tabs } from 'react-bootstrap';
    //import Component from '../conditionalcomponents/Component'
    import { Head } from "./conditionalComponent/Head";
    import { Home } from "./conditionalComponent/Home";
    class App extends React.Component {

        render(){
            return(
              <div className="container">
                  <div className="row" >
                    <div className="col-xs-10 col-xs-offset-1" style={{ width: '100vw'}}>
                        <Head/>
                    </div>
                      <hr/>
                  </div>
                  <BrowserRouter>
                    <Route exact path="/webinar/:webinarId/:profileId" component={Home} />
                  </BrowserRouter>
              </div>
            );
        }
    }

    ReactDOM.render(<App/>,document.getElementById("root"));
