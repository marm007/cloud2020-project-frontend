import React, {useEffect, useState} from 'react';
import {MapContainer as LeafletMap, Marker, Popup, TileLayer} from 'react-leaflet';
import CanvasJSReact from '../../assets/canvasjs.react';
import SensorService from "../../services/sensor.service";
import Table from 'react-bootstrap/Table';
import Timer from "../Timer/Timer";

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

const options = {
    animationEnabled: true,
    exportEnabled: true,
    theme: "light2", //"light1", "dark1", "dark2"
    title: {
        text: "Histogram"
    },
    axisY: {
        includeZero: true
    }
};


const generateColors = (max = 150) => {
    let colors = [];

    const r = Math.round(Math.random() * 255);
    const g = Math.round(Math.random() * 255);
    const b = Math.round(Math.random() * 255);
    colors.push(rgbToHex(r, g, b));

    return colors;
};

const componentToHex = (c) => {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
};

const rgbToHex = (r, g, b) => {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};


export default function SensorMap() {

    const [colors, setColors] = useState(generateColors());

    const [allDataFetched, setAllDataFetched] = useState(false);
    const [vmNames, setVmNames] = useState([]);

    const [sensorInformation, updateSensorInformation] = useState([]);
    const [sensorData, updateSensorData] = useState([]);
    const [sensorAverageData, updateSensorAverageData] = useState([]);
    const [sensorHistogramData, updateSensorHistogramData] = useState([]);

    const handleUpdateData = async (_vmNames = []) => {

        if (_vmNames.length === 0)
            _vmNames = vmNames
        for (const _vName of _vmNames) {
            const lastCrossingSession = await SensorService.getLastCrossingSession({vm_name: _vName})
            const crossingHistogramData = await SensorService.getHistogramDataFromCrossingSessions({vm_name: _vName})
            updateSensorData(lastCrossingSession.data);
            console.log(lastCrossingSession)
            console.log(crossingHistogramData)
        }

    };

    useEffect(() => {
        async function fetchData() {
            const sensorInformation = await SensorService.getSensorInformation()
            console.log(sensorInformation)

            let _vmNames = []

            for (const sensor of sensorInformation.data) {
                if (_vmNames.indexOf(sensor.vm_name) === -1) {
                    _vmNames.push(sensor.vm_name);
                }
            }

            await handleUpdateData(_vmNames);

            updateSensorInformation(sensorInformation.data);
            setVmNames(_vmNames)
        }

        fetchData()
    }, []);

    return (

        <div>
            <div>
                <Timer onTimerCountedDown={handleUpdateData}/>
                {sensorInformation.length > 0 && <LeafletMap center={sensorInformation[0].location} zoom={15}>
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {vmNames.map((_vmName, indexVM) => {
                        {
                            console.log(_vmName)
                            console.log(sensorInformation)
                           return sensorInformation.filter((_i) => _i.vm_name === _vmName)
                                .map((_information, index) => {
                                return <Marker position={_information.location} key={index}>
                                    <Popup minWidth="800">
                                        {sensorData.length > 0 &&
                                        <Table striped bordered hover size="sm">
                                            <thead>
                                            <tr>
                                                <th>Location</th>
                                                <th>Start date</th>
                                                <th>End date</th>
                                                {sensorData[indexVM].red[0].sensor_id === _information.sensor_id &&
                                                <th>Number of cars waiting</th>}
                                                {sensorData[indexVM].green[0].sensor_id === _information.sensor_id &&
                                                <th>Number of cars passed</th>}
                                            </tr>
                                            </thead>
                                            <tbody>
                                            <tr>
                                                <td><span
                                                    className="font-weight-bold">lat: </span>{_information.location[0]}
                                                    <span
                                                        className="font-weight-bold">&nbsp;&nbsp;lng: </span>{_information.location[1]}
                                                </td>
                                                <td>{sensorData[indexVM].start_date}</td>
                                                <td>{sensorData[indexVM].end_date}</td>
                                                {sensorData[indexVM].red[0].sensor_id === _information.sensor_id &&
                                                <td>{sensorData[indexVM].red.length}</td>}
                                                {sensorData[indexVM].green[0].sensor_id === _information.sensor_id &&
                                                <td>{sensorData[indexVM].green.length}</td>}
                                            </tr>
                                            </tbody>
                                        </Table>
                                        }
                                    </Popup>
                                </Marker>
                            })
                        }
                    })}
                </LeafletMap>}
            </div>
            }
        </div>
    );
};
