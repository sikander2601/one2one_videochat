    import React from "react";

    export class Head extends React.Component {
        render(){
            return(
              <nav className="navbar navbar-inverse" style={{ backgroundColor:'grey'}}>
                  <div className="container-fluid">
                      <div className="navbar-header">
                      </div>
                      <ul className=" nav navbar-nav ">
                          <li>
                              <a style={{color: 'white'}} href="/webinar"> Home </a>
                          </li>
                      </ul>
                  </div>
              </nav>
            );
        }
    }