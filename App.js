/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from "react";
import {
  AppState,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Text,
  Linking
} from "react-native";
import qs from "qs";
import config from "./config.js";

function OAuth(client_id, cb) {
  Linking.addEventListener("url", handleUrl);
  function handleUrl(event) {
    // console.log(event.url);
    Linking.removeEventListener("url", handleUrl);
    const [, query_string] = event.url.match(/\#(.*)/);
    // console.log(query_string);
    const query = qs.parse(query_string);
    // console.log(`query: ${JSON.stringify(query)}`);
    cb(query.access_token);
  }
  const oauthurl = `https://www.fitbit.com/oauth2/authorize?${qs.stringify({
  client_id,
  response_type: "token",
  scope: "heartrate activity activity profile sleep",
  redirect_uri: "exp://en-mzb.anonymous.awesomeproject.exp.direct:80",
  expires_in: "31536000",
  })}`;
  console.log("url:" + oauthurl);
  Linking.openURL(oauthurl).catch(err => console.error("Error processing linking", err));
}

function getData(access_token) {
  let now = new Date();
  let today = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
  console.log("getData");
  return fetch("https://api.fitbit.com/1.2/user/-/activities/date/" + today + ".json", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    // body: `root=auto&path=${Math.random()}`
    });
}

export default class App extends Component {
  componentDidMount() {
    console.log("componentDidMount");
    OAuth(config.client_id, (token) => { 
      getData(token)
      .then(res => res.json())
      .then((res) => {
        console.log("res", res);
        this.setState({...res, token: token});
      }).catch(err => {
        console.error("Error: ", err);
      })
    });
    AppState.addEventListener("change", this._handleAppStateChange);
   }

  componentWillUnmount() {
    AppState.removeEventListener("change", this._handleAppStateChange);
  }

  _handleAppStateChange = (nextAppState) => {
    if (
      this.state.appState.match(/inactive|background/) &&
      nextAppState === "active"
    ) {
      console.log("App has come to the foreground!");
      this._onRefresh();
    }
    this.setState({appState: nextAppState});
  };
   
   state = {
     appState: AppState.currentState,
     refreshing: false
   };

   static getDerivedStateFromError (error) {
     console.log("xxxxxx", error);
    return { hasError: true };
  }

  componentDidCatch (error, info) {
    console.log(error, info.componentStack);
  }

  _onRefresh = () => {
    this.setState({refreshing: true});
    console.log("_onRefresh", "this.state.token", this.state.token);
    getData(this.state.token)
    .then(res => res.json())
    .then((res) => {
      console.log("res", res);
      this.setState({...res, refreshing: false});
    }).catch(err => {
      console.error("Error: ", err);
      this.setState({refreshing: false});
    });
  }

   render() {
    return (
    <ScrollView contentContainerStyle={styles.container} refreshControl={
      <RefreshControl
        refreshing={this.state.refreshing}
        onRefresh={this._onRefresh}
      />
    }>
      <Text style={styles.welcome}>
       {"Howdy there! You have " + (this.state && this.state.summary ? (this.state.goals.steps - (this.state.summary.steps % this.state.goals.steps)) : "?") + " steps till your next goal!"}
      </Text>
    </ScrollView>
    );
   }
  }

  const styles = StyleSheet.create({
    container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#00a8b5",
    },
    welcome: {
    fontSize: 25,
    textAlign: "center",
    color: "#fff",
    margin: 10,
    },
  });