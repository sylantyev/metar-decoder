
"use strict";

const metarInput = document.getElementById("metarInput");
const decodeButton = document.getElementById("decodeButton");
const clearButton = document.getElementById("clearButton");

const status = document.getElementById("status");
const decodedData = document.getElementById("decodedData");


decodeButton.addEventListener("click", function () {
    const metarText = metarInput.value.trim();

    if (!metarText) {
        status.textContent = "Будь ласка, введіть METAR.";
        decodedData.innerHTML = "";
        return;
    }

    try {
        const result = parseMETAR(metarText);

        status.textContent =
            `METAR успішно декодовано. Станція: ${result.station}`;

        renderDecodedData(result);

    } catch (error) {
        status.textContent = `Помилка: ${error.message}`;
        decodedData.innerHTML = "";
    }
});


clearButton.addEventListener("click", function () {
    metarInput.value = "";

    status.textContent =
        "Введіть METAR та натисніть «Decode METAR».";

    decodedData.innerHTML = "";
});


function renderDecodedData(result) {
    decodedData.innerHTML = "";

    addDataItem(
        "Станція",
        result.station || "—"
    );

    if (result.observationTime) {
        const time = result.observationTime;

        addDataItem(
            "Час спостереження",
            `${String(time.day).padStart(2, "0")} число, ` +
            `${String(time.hour).padStart(2, "0")}:${String(time.minute).padStart(2, "0")} UTC`
        );
    }

    if (result.wind) {
        const wind = result.wind;

        let windText;

        if (wind.direction === "VRB") {
            windText = "Змінний напрямок";
        } else {
            windText = `${wind.direction}°`;
        }

        windText += `, ${wind.speed} ${wind.unit}`;

        if (wind.gust !== null) {
            windText += `, пориви ${wind.gust} ${wind.unit}`;
        }

        addDataItem("Вітер", windText);
    }

    if (result.visibility) {
        addDataItem(
            "Видимість",
            result.visibility.text
        );
    }

    if (result.weather.length > 0) {
        addDataItem(
            "Погодні явища",
            result.weather.map(item => item.raw).join(", ")
        );
    }

    if (result.clouds.length > 0) {
        const cloudsText = result.clouds.map(cloud => {
            let text =
                `${cloud.amount} ${cloud.altitudeFeet} ft`;

            if (cloud.type) {
                text += ` ${cloud.type}`;
            }

            return text;
        }).join("; ");

        addDataItem("Хмарність", cloudsText);
    }

    if (result.temperature !== null) {
        addDataItem(
            "Температура",
            `${result.temperature} °C`
        );
    }

    if (result.dewPoint !== null) {
        addDataItem(
            "Точка роси",
            `${result.dewPoint} °C`
        );
    }

    if (result.pressure) {
        if (result.pressure.type === "QNH") {
            addDataItem(
                "Тиск QNH",
                `${result.pressure.hPa} hPa`
            );
        } else {
            addDataItem(
                "Тиск",
                `${result.pressure.inHg} inHg`
            );
        }
    }

    if (result.trend) {
        addDataItem(
            "Тенденція",
            result.trend
        );
    }

    if (result.remarks && result.remarks.length > 0) {
        addDataItem(
            "Примітки",
            result.remarks.join(" ")
        );
    }

    if (result.unknown.length > 0) {
        addDataItem(
            "Нерозпізнані групи",
            result.unknown.join(" ")
        );
    }
}


function addDataItem(label, value) {
    const item = document.createElement("div");
    item.className = "data-item";

    const labelElement = document.createElement("span");
    labelElement.className = "data-label";
    labelElement.textContent = label;

    const valueElement = document.createElement("span");
    valueElement.className = "data-value";
    valueElement.textContent = value;

    item.appendChild(labelElement);
    item.appendChild(valueElement);

    decodedData.appendChild(item);
}