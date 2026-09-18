"use strict";

/**
 * METAR Decoder v0.1
 *
 * Parses the basic ICAO METAR groups:
 * - Station
 * - Observation time
 * - Wind
 * - Visibility
 * - Clouds
 * - Temperature / Dew point
 * - QNH
 * - Trend
 */

function parseMETAR(metarText) {
    if (typeof metarText !== "string") {
        throw new Error("METAR must be a string.");
    }

    const raw = metarText.trim().replace(/\s+/g, " ");

    if (!raw) {
        throw new Error("METAR is empty.");
    }

    const tokens = raw.split(" ");

    const result = {
        raw: raw,
        type: "METAR",
        station: null,
        observationTime: null,
        wind: null,
        visibility: null,
        weather: [],
        clouds: [],
        temperature: null,
        dewPoint: null,
        pressure: null,
        trend: null,
        modifiers: [],
        unknown: []
    };

    let i = 0;

    /*
     * Optional report type.
     * Example:
     * METAR UKBB 161500Z ...
     */
    if (tokens[i] === "METAR" || tokens[i] === "SPECI") {
        result.type = tokens[i];
        i++;
    }

    /*
     * Station identifier.
     * ICAO station code normally consists of 4 letters.
     */
    if (i < tokens.length && /^[A-Z]{4}$/.test(tokens[i])) {
        result.station = tokens[i];
        i++;
    } else {
        throw new Error("ICAO station identifier not found.");
    }

    /*
     * Observation time.
     * Example: 161500Z
     */
    if (i < tokens.length && /^\d{6}Z$/.test(tokens[i])) {
        result.observationTime = parseObservationTime(tokens[i]);
        i++;
    }

    while (i < tokens.length) {
        const token = tokens[i];
        if (token === "AUTO") {
        result.modifiers.push("AUTO");
        i++;
        continue;
}
        if (token === "COR") {
        result.modifiers.push("COR");
        i++;
        continue;
}

        /*
         * Wind
         * Examples:
         * 25006KT
         * 25006MPS
         * 00000KT
         * VRB03KT
         * 18012G25KT
         */
        if (isWindGroup(token)) {
            result.wind = parseWind(token);
            i++;
            continue;
        }

        /*
         * Visibility
         * 9999 means 10 km or more in ICAO metric METAR.
         */
        if (isVisibilityGroup(token)) {
            result.visibility = parseVisibility(token);
            i++;
            continue;
        }

        /*
         * Weather phenomena.
         * Examples:
         * -RA
         * +TSRA
         * BR
         * FG
         */
        if (isWeatherGroup(token)) {
            result.weather.push(parseWeather(token));
            i++;
            continue;
        }

        /*
         * Clouds
         * FEW030
         * SCT030
         * BKN015
         * OVC008
         */
        if (isCloudGroup(token)) {
            result.clouds.push(parseCloud(token));
            i++;
            continue;
        }

        /*
         * Temperature / dew point
         * Examples:
         * 18/12
         * 18/M02
         * M03/M08
         */
        if (isTemperatureGroup(token)) {
            const temperature = parseTemperature(token);
            result.temperature = temperature.temperature;
            result.dewPoint = temperature.dewPoint;
            i++;
            continue;
        }

        /*
         * Pressure
         * Q1018
         * A2992
         */
        if (isPressureGroup(token)) {
            result.pressure = parsePressure(token);
            i++;
            continue;
        }

        /*
         * Trend
         */
        if (token === "NOSIG" || token === "BECMG" || token === "TEMPO") {
            result.trend = token;
            i++;
            continue;
        }

        /*
         * Remarks
         */
        if (token === "RMK") {
            result.remarks = tokens.slice(i + 1);
            break;
        }

        /*
         * Anything not recognized is preserved.
         */
        result.unknown.push(token);
        i++;
    }

    return result;
}


/**
 * Parse observation time.
 * 161500Z -> day 16, hour 15, minute 00 UTC
 */
function parseObservationTime(token) {
    return {
        raw: token,
        day: Number(token.substring(0, 2)),
        hour: Number(token.substring(2, 4)),
        minute: Number(token.substring(4, 6)),
        timezone: "UTC"
    };
}


/**
 * Detect wind group.
 */
function isWindGroup(token) {
    return /^(VRB|\d{3})\d{2}(G\d{2})?(KT|MPS)$/.test(token);
}


/**
 * Parse wind.
 */
function parseWind(token) {
    const match = token.match(
        /^(VRB|\d{3})(\d{2})(G(\d{2}))?(KT|MPS)$/
    );

    if (!match) {
        return null;
    }

    const direction = match[1];
    const speed = Number(match[2]);
    const gust = match[4] ? Number(match[4]) : null;
    const unit = match[5];

    return {
        raw: token,
        direction: direction,
        speed: speed,
        gust: gust,
        unit: unit
    };
}


/**
 * Detect visibility.
 *
 * ICAO metric visibility:
 * 9999
 * 5000
 * 0800
 */
function isVisibilityGroup(token) {
    return /^\d{4}$/.test(token) || /^\d+(?:\.\d+)?SM$/.test(token);
}


/**
 * Parse visibility.
 */
function parseVisibility(token) {
    if (token.endsWith("SM")) {
        const miles = Number(token.slice(0, -2));
        const meters = Math.round(miles * 1609.344);

        return {
            raw: token,
            meters: meters,
            statuteMiles: miles,
            text: `${meters} m`
        };
    }

    const value = Number(token);

    return {
        raw: token,
        meters: value,
        text: value === 9999
            ? "10 km or more"
            : `${value} m`
    };
}


/**
 * Detect weather group.
 */
function isWeatherGroup(token) {
    return /^(\+|-|VC)?(MI|BC|PR|DR|BL|SH|TS|FZ)?(DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)$/.test(token);
}


/**
 * Parse weather phenomenon.
 */
function parseWeather(token) {
    let intensity = null;

    if (token.startsWith("+")) {
        intensity = "heavy";
    } else if (token.startsWith("-")) {
        intensity = "light";
    }

    return {
        raw: token,
        intensity: intensity,
        code: token
    };
}


/**
 * Detect cloud group.
 */
function isCloudGroup(token) {
    return /^(FEW|SCT|BKN|OVC)\d{3}(CB|TCU)?$/.test(token);
}


/**
 * Parse cloud group.
 */
function parseCloud(token) {
    const match = token.match(
        /^(FEW|SCT|BKN|OVC)(\d{3})(CB|TCU)?$/
    );

    if (!match) {
        return null;
    }

    return {
        raw: token,
        amount: match[1],
        altitudeHundredsFeet: Number(match[2]),
        altitudeFeet: Number(match[2]) * 100,
        type: match[3] || null
    };
}


/**
 * Detect temperature/dew point group.
 */
function isTemperatureGroup(token) {
    return /^M?\d{2}\/M?\d{2}$/.test(token);
}


/**
 * Parse temperature/dew point.
 */
function parseTemperature(token) {
    const [temperatureRaw, dewPointRaw] = token.split("/");

    return {
        temperature: parseSignedTemperature(temperatureRaw),
        dewPoint: parseSignedTemperature(dewPointRaw)
    };
}


/**
 * Parse signed temperature.
 * M02 -> -2
 * 18  -> 18
 */
function parseSignedTemperature(value) {
    if (value.startsWith("M")) {
        return -Number(value.substring(1));
    }

    return Number(value);
}


/**
 * Detect pressure group.
 */
function isPressureGroup(token) {
    return /^Q\d{4}$/.test(token) || /^A\d{4}$/.test(token);
}


/**
 * Parse pressure.
 */
function parsePressure(token) {
    if (token.startsWith("Q")) {
        return {
            raw: token,
            type: "QNH",
            hPa: Number(token.substring(1)),
            unit: "hPa"
        };
    }

    if (token.startsWith("A")) {
        const inchesHundredths = Number(token.substring(1));

        return {
            raw: token,
            type: "Altimeter",
            inHg: inchesHundredths / 100,
            unit: "inHg"
        };
    }

    return null;
}


/*
 * Export for browser and tests.
 */
if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        parseMETAR,
        parseObservationTime,
        parseWind,
        parseVisibility,
        parseWeather,
        parseCloud,
        parseTemperature,
        parsePressure
    };
}
