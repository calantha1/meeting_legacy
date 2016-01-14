/*
 * Copyright (C) 2015-2016 InSeven Limited.
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, IndexRoute, Link, browserHistory } from 'react-router'

var injectTapEventPlugin = require('react-tap-event-plugin');
injectTapEventPlugin();

import Divider from 'material-ui/lib/divider';
import MenuItem from 'material-ui/lib/menus/menu-item';
import RaisedButton from 'material-ui/lib/raised-button';
import ThemeManager from 'material-ui/lib/styles/theme-manager';
import ExitToApp from 'material-ui/lib/svg-icons/action/exit-to-app';
import Photo from 'material-ui/lib/svg-icons/image/photo';
import InsertLink from 'material-ui/lib/svg-icons/editor/insert-link';
import FileUpload from 'material-ui/lib/svg-icons/file/file-upload';
import Star from 'material-ui/lib/svg-icons/toggle/star';
import Test from 'material-ui/lib/svg-icons/image/remove-red-eye';

import AddItemDialog from './lib/components/add-item-dialog.jsx';
import ItemGrid from './lib/components/item-grid.jsx';
import ItemView from './lib/components/item-view.jsx';
import MeetingAppScreen from './lib/components/meeting-app-screen.jsx';
import MeetingDocumentViewer from './lib/components/meeting-document-viewer.jsx';
import MeetingDragTarget from './lib/components/meeting-drag-target.jsx';
import MeetingTheme from './lib/components/meeting-theme.jsx';
import MeetingWebRTC from './lib/components/meeting-web-rtc.jsx';

import Engine from './lib/engine.jsx';
import webRTC from './lib/webrtc.jsx';

const CallState = {
    DISCONNECTED: 0,
    CONNECTING: 1,
    CONNECTED: 2,
};

var engine = new Engine();

class MeetingApp extends React.Component {

    constructor(props) {
        super(props);
        this.state = {

            title: "",
            items: [],
            users: [],
            selection: undefined,

            showNavigation: false,
            showAddItemDialog: false,

            callState: webRTC.UNSUPPORTED,
            offer: undefined,
            answer: undefined,

        };

    }

    getChildContext() {
        return {
            muiTheme: ThemeManager.getMuiTheme(MeetingTheme),
        };
    }

    engineStateObserver = (state) => {
        this.setState(state);
    }

    componentDidMount() {
        engine.addStateObserver(this.engineStateObserver);
    }

    componentWillUnmount() {
        engine.removeStateObserver(this.engineStateObserver);
    }

    render() {
        var self = this;

        const menuItems = [
            <MenuItem
                key="add-url-menu-item"
                primaryText="Add URL"
                leftIcon={<InsertLink />}
                onTouchTap={() => this.setState({showAddItemDialog: true})} />,
            <MenuItem
                key="add-file-menu-item"
                primaryText="Add file"
                leftIcon={<FileUpload />}
                onTouchTap={() => this.refs.input.click()} />,
            <MenuItem
                key="add-photo-menu-item"
                primaryText="Add photo"
                leftIcon={<Photo />}
                onTouchTap={() => this.refs.input.click()} />,
            <Divider />,
            <MenuItem
                key="add-continuous-improvement-menu-item"
                primaryText="Add continuous improvement"
                leftIcon={<Star />}
                onTouchTap={() => engine.addItem({
                    title: "Continuous Improvement",
                    url: "uploads/table.html"
                })} />,
            <Divider />,
            <MenuItem
                key="leave-meeting-menu-item"
                primaryText="Leave meeting"
                leftIcon={<ExitToApp />}
                onTouchTap={() => this.context.history.push('/')} />
        ];

        const navigationItems = [
            <MenuItem
                key="menu-item-navigation-item"
                primaryText="Live"
                leftIcon={<Test />}
                onTouchTap={() => {
                    this.context.history.push(`/meeting/${this.props.uuid}`);
                    this.setState({showNavigation: false});
                }} />
        ];

        return (
            <div>

                <input
                    type="file"
                    accept="image/*"
                    id="file"
                    name="file"
                    ref="input"
                    onChange={(event) => {
                        for (var i = 0, f; f = event.target.files[i]; i++) {
                            engine.upload(f);
                        }
                    }}
                    hidden />

                <MeetingAppScreen
                    title={this.state.title}
                    navigationItems={navigationItems}
                    menuItems={menuItems}
                    showNavigation={this.state.showNavigation}
                    onShowNavigation={(show) => this.setState({showNavigation: show})}>

                    <MeetingDragTarget 
                        onDropFile={(files) => {
                            for (var i = 0, f; f = files[i]; i++) {
                                engine.upload(f);
                            }
                        }}>

                        {this.props.children}

                    </MeetingDragTarget>

                </MeetingAppScreen>

                <AddItemDialog
                    open={this.state.showAddItemDialog}
                    onSubmit={(title, url) => {
                        this.setState({showAddItemDialog: false});
                        engine.addItem({title: title, url: url});
                    }}
                    onCancel={() => this.setState({showAddItemDialog: false})} />

                <MeetingWebRTC
                    useAppRTC={true}
                    callState={self.state.callState}
                    offer={self.state.offer}
                    localStream={self.state.localStream}
                    remoteStream={self.state.remoteStream}
                    onStartCall={() => engine.startCall()}
                    onAcceptCall={() => {

                        if (webRTC.state == webRTC.DISCONNECTED) {
                            webRTC.setOffer(self.state.offer);
                            engine._sendMessage('client-call-set-offer', undefined);
                        } else {
                            alert("Received offer in unexpected state (" + webRTC.state + ")");
                        }

                    }} />

            </div>
        );
    }
}

MeetingApp.contextTypes = {
    history: React.PropTypes.object.isRequired,
};

MeetingApp.childContextTypes = {
    muiTheme: React.PropTypes.object,
};

class Live extends React.Component {

    constructor(props) {
        super(props);
        this.state = {items: []};
    }

    engineStateObserver = (state) => {
        this.setState(state);
    }

    componentDidMount() {
        engine.addStateObserver(this.engineStateObserver);
    }

    componentWillUnmount() {
        engine.removeStateObserver(this.engineStateObserver);
    }

    render() {
        return (
            <div>
            
                <ItemGrid
                    items={this.state.items}
                    onRemoveItem={(index) => engine.removeItem(index)}
                    onSelect={(index) => engine.setSelection(index)} />

                <ItemView
                    open={this.state.selection != undefined}
                    item={this.state.selection}
                    onRequestClose={() => engine.setSelection(undefined)} />

            </div>
        );
    }

}

class MeetingList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            meetings: [{title: 'Default Meeting', uuid: '39872239'}]
        };
    }

    render() {
        return (
            <ul>
                {this.state.meetings.map(function(item, index) {
                    return (
                        <li key={item.uuid}><Link to={`/meeting/${item.uuid}`}>{item.title}</Link></li>
                    );
                })}
            </ul>
        );
    }

}

ReactDOM.render((
    <Router history={browserHistory}>
        <Route path="/" component={MeetingList} />
        <Route path="/meeting/:uuid" component={MeetingApp}>
            <IndexRoute component={Live} />
        </Route>
        <Route path="/viewer/:path" component={MeetingDocumentViewer} />
    </Router>
), document.getElementById('app'));

webRTC.onIceCandidate = function (candidate) {
    if (candidate.candidate.indexOf("relay") < 0) {
        // return;
    }
    console.log("Sending ICE Candidate: " + candidate.candidate);
    engine.addIceCandidate(candidate);
}

webRTC.onSessionDescription = function(session) { engine.setSession(session); }
webRTC.onAttachLocalStream = function(stream) { engine.setLocalStream(stream); }
webRTC.onAttachRemoteStream = function(stream) { engine.setRemoteStream(stream); }
webRTC.onStateChange = function(state) { engine.setCallState(state); }
webRTC.setup();

engine.connect();

