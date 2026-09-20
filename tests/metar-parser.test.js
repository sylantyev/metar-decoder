"use strict";

const assert = require("assert");
const { parseMETAR } = require("../js/metar-parser");

function test(name, metar, check) {
    const result = parseMETAR(metar);
    check(result);
    console.log(`PASS: ${name}`);
}

test("Basic METAR", "UKBB 161500Z 25006MPS 9999 SCT030 18/12 Q1018 NOSIG", result => {
    assert.strictEqual(result.station, "UKBB");
    assert.strictEqual(result.observationTime.hour, 15);
    assert.strictEqual(result.wind.direction, "250");
    assert.strictEqual(result.wind.speed, 6);
    assert.strictEqual(result.visibility.meters, 9999);
    assert.strictEqual(result.temperature, 18);
    assert.strictEqual(result.dewPoint, 12);
    assert.strictEqual(result.pressure.hPa, 1018);
    assert.strictEqual(result.trend, "NOSIG");
});

test("Calm wind", "KMSO 290953Z AUTO 00000KT 10SM CLR 14/04 A2992", result => {
    assert.strictEqual(result.wind.direction, "000");
    assert.strictEqual(result.wind.speed, 0);
    assert.ok(result.modifiers.includes("AUTO"));
    assert.strictEqual(result.visibility.statuteMiles, 10);
    assert.strictEqual(result.clouds[0].amount, "CLR");
    assert.strictEqual(result.pressure.inHg, 29.92);
});

test("US visibility", "KMSO 282053Z VRB03KT 10SM CLR 27/06 A2991", result => {
    assert.strictEqual(result.visibility.raw, "10SM");
    assert.strictEqual(result.visibility.statuteMiles, 10);
    assert.strictEqual(result.visibility.meters, 16093);
});

test("Variable wind", "KMSO 282053Z VRB03KT 10SM CLR 27/06 A2991", result => {
    assert.strictEqual(result.wind.direction, "VRB");
    assert.strictEqual(result.wind.speed, 3);
});

/**/

test("CLR cloud condition", "KMSO 282053Z VRB03KT 10SM CLR 27/06 A2991", result => {
    assert.strictEqual(result.clouds.length, 1);
    assert.strictEqual(result.clouds[0].amount, "CLR");
    assert.strictEqual(result.clouds[0].altitudeFeet, null);
});

test("Wind gust", "KMJX 100256Z AUTO 20009G14KT 10SM CLR 23/18 A3003", result => {
    assert.strictEqual(result.wind.direction, "200");
    assert.strictEqual(result.wind.speed, 9);
    assert.strictEqual(result.wind.gust, 14);
});

test("Negative temperature", "KMSO 181200Z 18005KT 9999 FEW020 M03/M08 Q1015", result => {
    assert.strictEqual(result.temperature, -3);
    assert.strictEqual(result.dewPoint, -8);
    assert.strictEqual(result.clouds[0].altitudeFeet, 2000);
});



/**/
test("CAVOK", "LIBF 112050Z 28008KT CAVOK 25/20 Q1018", result => {
    assert.strictEqual(result.visibility.cavok, true);
    assert.strictEqual(result.visibility.meters, 10000);
    assert.strictEqual(result.clouds.length, 0);
});

test("AUTO cloud groups", "EDMA 032050Z AUTO VRB02KT 9999 // FEW063/// OVC076/// 21/11 Q1022", result => {
    assert.ok(result.modifiers.includes("AUTO"));
    assert.ok(result.unknown.includes("//"));
    assert.ok(result.unknown.includes("FEW063///"));
    assert.ok(result.unknown.includes("OVC076///"));
});

test("COR", "KMSO 291353Z COR 26004KT 10SM BKN080 12/04 A2993", result => {
    assert.ok(result.modifiers.includes("COR"));
    assert.strictEqual(result.clouds[0].amount, "BKN");
});

test("Rain", "UKBB 161200Z 25012KT 4000 -RA SCT015 16/13 Q1012", result => {
    assert.strictEqual(result.visibility.meters, 4000);
    assert.strictEqual(result.weather[0].raw, "-RA");
});

test("Thunderstorm", "UKBB 161300Z 34015G25KT 4000 TSRA SCT012CB 18/16 Q1008", result => {
    assert.strictEqual(result.wind.gust, 25);
    assert.strictEqual(result.weather[0].raw, "TSRA");
    assert.strictEqual(result.clouds[0].type, "CB");
});

test("Fog and RVR", "ESMQ 300120Z AUTO 15003KT 0150 R16/1000N R34/P1500N FG FEW001/// 13/13 Q1007", result => {
    assert.strictEqual(result.visibility.meters, 150);
    assert.strictEqual(result.weather[0].raw, "FG");
    assert.strictEqual(result.rvr.length, 2);
    assert.strictEqual(result.rvr[0].runway, "16");
    assert.strictEqual(result.rvr[0].visibility, 1000);
    assert.strictEqual(result.rvr[0].trend, "N");
    assert.strictEqual(result.rvr[1].runway, "34");
    assert.strictEqual(result.rvr[1].visibility, 1500);
    assert.strictEqual(result.rvr[1].above, true);
});

/**/ 
test("RVR", "ESMQ 300120Z AUTO 15003KT 0150 R16/1000N R34/P1500N FG FEW001/// 13/13 Q1007", result => {
    assert.strictEqual(result.rvr.length, 2);
    assert.strictEqual(result.rvr[0].runway, "16");
    assert.strictEqual(result.rvr[0].visibility, 1000);
    assert.strictEqual(result.rvr[0].trend, "N");
    assert.strictEqual(result.rvr[1].runway, "34");
    assert.strictEqual(result.rvr[1].visibility, 1500);
    assert.strictEqual(result.rvr[1].above, true);
});

test("Remarks", "KMJX 100256Z 20009G14KT 10SM SCT025 23/18 A3003 RMK AO2 SLP170 T02280178 58008", result => {
    assert.strictEqual(
        result.remarks.join(" "),
        "AO2 SLP170 T02280178 58008"
    );
});

test("Multiple clouds", "UKBB 161500Z 25006KT 9999 FEW050 SCT080 BKN120 OVC250 18/12 Q1018", result => {
    assert.strictEqual(result.clouds.length, 4);
    assert.strictEqual(result.clouds[0].altitudeFeet, 5000);
    assert.strictEqual(result.clouds[3].altitudeFeet, 25000);
});

//
test("AUTO modifier", "KMSO 290953Z AUTO 00000KT 10SM CLR 14/04 A2992", result => {
    assert.ok(result.modifiers.includes("AUTO"));
    assert.ok(!result.unknown.includes("AUTO"));
});
console.log("\nAll automated v0.1 tests passed.");