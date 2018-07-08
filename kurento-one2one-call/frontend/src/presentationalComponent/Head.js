import React from "react";
import { Navbar, Nav, NavItem, MenuItem, NavDropdown } from "react-bootstrap";
import '../CSS/header.css';

export class Head extends React.Component {
    render(){
        return(
                <div className="header-content-Wrapper">
                    <div className="logo-wrapper">
                        <a href='#' target='_self' title = 'Refier'>
                            <img src = { 'https://refier.com/static/assets_new/images/logo@2x.png' } alt="Logo" />
                        </a>
                    </div>
                </div>

        );
    }
}

