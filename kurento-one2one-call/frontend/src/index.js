    import React from 'react';
    import ReactDOM from 'react-dom';
    //import { Grid, Row, Alert, Col, Tab, Tabs } from 'react-bootstrap';
    //import Component from '../conditionalcomponents/Component'
    import { Head } from "./components/Head";
    import { Home } from "./components/Home";
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
                  <div className="col-xs-10">
                    <Home name={"Ak"}/>
                  </div>
              </div>
            );
        }
    }

    ReactDOM.render(<App/>,document.getElementById("root"));
