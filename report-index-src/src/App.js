import React, { Component } from 'react';
import './App.scss';
import Info from './resources/info';
import Report from './components/Report/Report';

import fresh_report from './images/fresh-report.svg'

class App extends Component {
    constructor(){
        super();

        this.state = {
            reports: [],
            additionalData: Info
        }
    }
    componentDidMount(){
        this.setState({reports: window.reports || []});
    }
  render() {
      return (
      <main>
        <header style={{ backgroundImage: `url(${fresh_report})`}}></header>
          <div className="report__wrap">
              <div className="report__title">Reports</div>
              <div className="report__list-wrap">
                  <div className="report__list">
                      {this.state.reports.map(item => (<Report report={item} additionalData={this.state.additionalData}/>))}
                  </div>
              </div>
          </div>
      </main>
    );
  }
}

export default App;
