import React, { Component } from 'react';
import './Report.scss';

class Report extends Component {
    render() {
        const {type, reportLink} = this.props.report;

        const backgroundColor = this.props.additionalData[type] ? `${this.props.additionalData[type].color}` : `${this.props.additionalData.default.color}`;
        const backgroundImage = this.props.additionalData[type] ? `url(${this.props.additionalData[type].imageUrl})` : `url(${this.props.additionalData.default.imageUrl})`;

        return (
                <div className="plugin" onClick={()=> window.open(reportLink, "_blank")}>
                    <div className="plugin__image" style={{backgroundImage, backgroundColor}}></div>
                    <h1>{type}</h1>
                    <a href={reportLink}>View</a>
                </div>
        );
    }
}

export default Report;
