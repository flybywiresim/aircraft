/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import React, {ChangeEvent, useState} from "react";
import {TileLayer, MapContainer, Marker, Popup, Tooltip, useMap} from "react-leaflet";
import L from "leaflet";

import {Telex, TelexConnection, Airport, AirportResponse} from "@flybywiresim/api-client";

import "leaflet/dist/leaflet.css";
import "./Map.scss";

type MapProps = {
    currentFlight: string,
    disableSearch: boolean,
    disableInfo: boolean,
}

type FlightsProps = {
    updateTotalFlights: Function,
    updateFlightData: Function,
    planeColor: string,
    planeHighlightColor: string,
    airportColor: string,
    iconsUseShadow: boolean,
    currentFlight: string,
    searchedFlight: string,
}
type FlightsState = {
    isUpdating: boolean,
    data: TelexConnection[],
    selectedAirports: SelectedAirportType[],
}

type SelectedAirportType = {
    airport: AirportResponse,
    tag: string
}

type SearchBarProps = {
    flightData: TelexConnection[],
    updateSearchedFlight: Function,
}
type SearchBarState = {
    nameList: string[],
    searchValue: string,
}

type InfoPanelProps = {
    totalFlights: number,
    tiles: TileSet[],
    changeTiles: Function,
}

type TileSet = {
    value: string,
    name: string,
    attribution: string,
    url: string,
    planeColor: string,
    planeHighlightColor: string,
    airportColor: string,
    iconsUseShadow: boolean,
}

export const MapX = (props: MapProps) => {
    const availableTileSets: TileSet[] = [
        {
            value: "carto-dark",
            name: "Dark",
            attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> &copy; <a href=\"http://cartodb.com/attributions\">CartoDB</a>",
            url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png",
            planeColor: "#00c2cb",
            planeHighlightColor: "#197bff",
            airportColor: "#ffffff",
            iconsUseShadow: true,
        },
        {
            value: "carto-light",
            name: "Light",
            attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a> &copy; <a href=\"http://cartodb.com/attributions\">CartoDB</a>",
            url: "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
            planeColor: "#00c2cb",
            planeHighlightColor: "#197bff",
            airportColor: "#545454",
            iconsUseShadow: true,
        },
        {
            value: "osm",
            name: "Open Street Map",
            attribution: "&copy; <a href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors",
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            planeColor: "#00c2cb",
            planeHighlightColor: "#197bff",
            airportColor: "#545454",
            iconsUseShadow: true,
        }
    ];

    const [currentFlight, setCurrentFlight] = useState<string>("");
    const [totalFlights, setTotalFlights] = useState<number>(0);
    const [selectedTile, setSelectedTile] = useState<TileSet>(findPreferredTile());
    const [flightData, setFlightData] = useState<TelexConnection[]>([]);
    const [searchedFlight, setSearchedFlight] = useState<string>("");

    function findPreferredTile(): TileSet {
        try {
            const storedTiles = window.localStorage.getItem("PreferredTileset");
            if (!storedTiles) {
                return availableTileSets[0];
            }

            return availableTileSets.find(x => x.value === storedTiles) || availableTileSets[0];
        } catch {
            return availableTileSets[0];
        }
    }

    function updateTotalFlights(flights: number) {
        setTotalFlights(flights);
    }

    function updateFlightData(data: TelexConnection[]) {
        setFlightData(data);
    }

    function updateSearchedFlight(flightName: string) {
        setSearchedFlight(flightName);
    }

    function selectTile(tile: string | null) {
        if (!tile) {
            return availableTileSets[0];
        }

        const newTiles = availableTileSets.find(x => x.value === tile) || availableTileSets[0];

        setSelectedTile(newTiles);
        window.localStorage.setItem("PreferredTileset", newTiles.value);

        location.reload();
    }

    return (
        <div>
            <MapContainer
                id="mapid"
                center={[51.505, -0.09]}
                zoom={5}
                scrollWheelZoom={true}>
                <TileLayer attribution={selectedTile.attribution} url={selectedTile.url} />
                {
                    !props.disableSearch ?
                        <SearchBar flightData={flightData} updateSearchedFlight={updateSearchedFlight}/>
                        :
                        <></>
                }
                <FlightsLayer
                    planeColor={selectedTile.planeColor}
                    planeHighlightColor={selectedTile.planeHighlightColor}
                    airportColor={selectedTile.airportColor}
                    updateTotalFlights={updateTotalFlights}
                    updateFlightData={updateFlightData}
                    iconsUseShadow={selectedTile.iconsUseShadow}
                    currentFlight={currentFlight}
                    searchedFlight={searchedFlight}
                />
                {
                    !props.disableInfo ?
                        <InfoPanel totalFlights={totalFlights} tiles={availableTileSets} changeTiles={selectTile}/>
                        :
                        <></>
                }
            </MapContainer>
        </div>
    );
};

class FlightsLayer extends React.Component<FlightsProps, FlightsState> {
    constructor(props: FlightsProps) {
        super(props);
    }

    intervalID: any;

    state: FlightsState = {
        isUpdating: false,
        data: [],
        selectedAirports: [],
    };

    componentDidMount() {
        this.getLocationData(true);
    }

    componentWillUnmount() {
        if (this.intervalID) {
            clearTimeout(this.intervalID);
        }
    }

    async getLocationData(staged: boolean = false) {
        console.log("Starting update");

        this.setState({
            isUpdating: true
        });

        let flights: TelexConnection[] = [];
        let skip = 0;
        let total = 0;

        do {
            try {
                const data = await Telex.fetchConnections(skip, 100);

                total = data.total;
                skip += data.count;
                flights = flights.concat(data.results);

                if (staged) {
                    this.setState({
                        data: flights
                    });
                }
            } catch (err) {
                console.error(err);
                break;
            }
        }
        while (total > skip);

        this.setState({
            isUpdating: false,
            data: flights
        });
        this.props.updateFlightData(flights);
        this.props.updateTotalFlights(total);
        this.intervalID = setTimeout(this.getLocationData.bind(this), 10000);
        console.log("Update finished");
    }

    async getAirports(origin: string, destination: string) {
        const airports: SelectedAirportType[] = [];

        // Two individual try/catch: If one fails the other should still show
        if (origin) {
            try {
                const originArpt = await Airport.get(origin);
                airports.push({airport: originArpt, tag: 'origin'});
            } catch (e) {
                console.error(e);
            }
        }

        if (destination) {
            try {
                const destinationArpt = await Airport.get(destination);
                airports.push({airport: destinationArpt, tag: 'destination'});
            } catch (e) {
                console.error(e);
            }
        }

        this.setState({selectedAirports: airports});
    }

    clearAirports() {
        this.setState({selectedAirports: []});
    }

    render() {
        return (
            <div>
                {
                    this.state.data.map((flight: TelexConnection) =>
                        <Marker
                            key={flight.id}
                            position={[flight.location.y, flight.location.x]}
                            icon={L.divIcon({
                                iconSize: [20, 20],
                                iconAnchor: [14, 10],
                                className: 'planeIcon',
                                html: `<i
                                style="font-size: 1.75rem; color: ${flight.flight === this.props.currentFlight ? this.props.planeHighlightColor : (this.props.searchedFlight === flight.flight) ? this.props.planeHighlightColor : this.props.planeColor};transform-origin: center; transform: rotate(${flight.heading}deg);"
                                class="material-icons ${this.props.iconsUseShadow ? 'map-icon-shadow' : ''}">flight</i>`
                            })}>
                            <Popup onOpen={() => this.getAirports(flight.origin, flight.destination)} onClose={() => this.clearAirports()}>
                                <h1>Flight {flight.flight}</h1>
                                {
                                    (flight.origin && flight.destination) ?
                                        <h2>{flight.origin} <i style={{transform: 'rotate(90deg)', fontSize: '1.1rem'}} className="material-icons">flight</i> {flight.destination}</h2>
                                        : ""
                                }
                                <p>Aircraft: {flight.aircraftType}</p>
                                <p>Altitude: {flight.trueAltitude}ft</p>
                            </Popup>
                        </Marker>
                    )
                }
                {
                    this.state.selectedAirports.map(airport =>
                        <Marker
                            position={[airport.airport.lat, airport.airport.lon]}
                            icon={L.divIcon({
                                iconSize: [20, 20],
                                iconAnchor: [14, 10],
                                className: "airportIcon",
                                html: `<i
                                    style="font-size: 1.75rem; color: ${this.props.airportColor};"
                                    class="material-icons ${this.props.iconsUseShadow ? 'map-icon-shadow' : ''}">${(airport.tag === "destination") ? 'flight_land' : 'flight_takeoff'}</i>`
                            })}>
                            <Tooltip direction="top" permanent>
                                <p>{airport.airport.icao} - {airport.airport.name}</p>
                            </Tooltip>
                        </Marker>
                    )
                }
            </div>
        );
    }
}

class SearchBar extends React.Component<SearchBarProps, SearchBarState> {
    state: SearchBarState = {
        nameList: this.generateNameList(),
        searchValue: "",
    }

    componentDidUpdate(prevProps: Readonly<SearchBarProps>) {
        if (prevProps.flightData !== this.props.flightData) {
            const names = this.generateNameList();
            this.setState({nameList: names});
        }
    }

    generateNameList() {
        const data = this.props.flightData;
        const nameList: string[] = [];
        data.map(flight => {
            nameList.push(flight.flight);
        });

        return nameList;
    }

    handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
        this.setState({searchValue: event.target.value.toString()});
    }

    handleSearch() {
        this.props.updateSearchedFlight(this.state.searchValue);
    }

    handleEnterPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            this.handleSearch();
        }
    }

    render() {
        return (
            <div className="leaflet-top leaflet-left Panel SearchPanel">
                <p className="PanelText">Search: </p>
                <input
                    type="text"
                    list="nameList"
                    placeholder="Flight Number"
                    onChange={this.handleSearchChange}
                    onKeyPress={this.handleEnterPress}/>
                <button onClick={this.handleSearch.bind(this)}>Search</button>
                <datalist id="nameList">
                    {
                        this.state.nameList.map(name =>
                            <option value={name} />
                        )
                    }
                </datalist>
            </div>
        );
    }
}

class InfoPanel extends React.Component<InfoPanelProps, any> {
    retrieveActiveTileSet() {
        try {
            const storedTiles = window.localStorage.getItem("PreferredTileset");
            if (!storedTiles) {
                return this.props.tiles[0];
            }

            return this.props.tiles.find(x => x.value === storedTiles) || this.props.tiles[0];
        } catch {
            return this.props.tiles[0];
        }
    }

    render() {
        return (
            <div className="leaflet-bottom leaflet-left Panel InfoPanel">
                <p className="PanelText">Total Flights: {this.props.totalFlights}</p>
                <p className="PanelText">
                    {"Map Style: "}
                    <select defaultValue={this.retrieveActiveTileSet().value} onChange={(event) => this.props.changeTiles(event.target.value)}>
                        {
                            this.props.tiles.map((tiles: TileSet) =>
                                <option value={tiles.value}>{tiles.name}</option>
                            )
                        }
                    </select>
                </p>
            </div>
        );
    }
}
