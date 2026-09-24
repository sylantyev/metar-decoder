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
    assert.strictEqual(result.wind.variableFrom, undefined);
    assert.strictEqual(result.wind.variableTo, undefined);
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

/**/
test("NSC", "UKBB 161500Z 25006KT 9999 NSC 18/12 Q1018", result => {
    assert.strictEqual(result.clouds.length, 1);
    assert.strictEqual(result.clouds[0].amount, "NSC");
    assert.strictEqual(result.clouds[0].altitudeFeet, null);
});

/**/
test("NCD", "UKBB 161500Z 25006KT 9999 NCD 18/12 Q1018", result => {
    assert.strictEqual(result.clouds.length, 1);
    assert.strictEqual(result.clouds[0].amount, "NCD");
    assert.strictEqual(result.clouds[0].altitudeFeet, null);
});


test("AUTO cloud groups", "EDMA 032050Z AUTO VRB02KT 9999 // FEW063/// OVC076/// 21/11 Q1022", result => {
    assert.ok(result.modifiers.includes("AUTO"));
    assert.ok(result.unknown.includes("//"));
    assert.strictEqual(result.clouds.length, 2);
    assert.strictEqual(result.clouds[0].amount, "FEW");
    assert.strictEqual(result.clouds[0].altitudeFeet, 6300);
    assert.strictEqual(result.clouds[0].automated, true);
    assert.strictEqual(result.clouds[1].amount, "OVC");
    assert.strictEqual(result.clouds[1].altitudeFeet, 7600);
    assert.strictEqual(result.clouds[1].automated, true);
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

/**/
test("Vertical visibility", "UKBB 161500Z 25006KT 3000 VV003 18/12 Q1018", result => {
    assert.strictEqual(result.visibility.verticalVisibility, true);
    assert.strictEqual(result.visibility.feet, 300);
    assert.strictEqual(result.visibility.meters, 91);
});

/**/
test("Fractional visibility", "KMSO 291200Z 25005KT 3/4SM CLR 10/05 A3000", result => {
    assert.strictEqual(result.visibility.statuteMiles, 0.75);
    assert.strictEqual(result.visibility.meters, 1207);
});

/**/
test("Mixed visibility", "KMSO 291200Z 25005KT 1 1/2SM CLR 10/05 A3000", result => {
    assert.strictEqual(result.visibility.statuteMiles, 1.5);
    assert.strictEqual(result.visibility.meters, 2414);
});

/**/
test("Wind direction variation", "KMSO 291200Z 18010KT 180V240 9999 SCT030 10/05 A3000", result => {
    assert.strictEqual(result.wind.variableFrom, 180);
    assert.strictEqual(result.wind.variableTo, 240);
});

/**/
test("Weather intensity", "UKBB 161500Z 25012KT 4000 -RA SCT015 18/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "-RA");
    assert.strictEqual(result.weather[0].intensity, "light");
});

/**/
test("Weather proximity", "UKBB 161500Z 25012KT 9999 VCSH SCT020 18/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "VCSH");
    assert.strictEqual(result.weather[0].code, "VCSH");
});

/**/
test("Heavy rain showers", "UKBB 161500Z 25012KT 3000 +SHRA SCT015 18/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "+SHRA");
    assert.strictEqual(result.weather[0].intensity, "heavy");
    assert.strictEqual(result.weather[0].code, "+SHRA");
});

/**/
test("Thunderstorm in vicinity", "UKBB 161500Z 25012KT 9999 VCTS SCT020 18/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "VCTS");
    assert.strictEqual(result.weather[0].code, "VCTS");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Freezing drizzle", "UKBB 161500Z 25012KT 3000 FZDZ SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "FZDZ");
    assert.strictEqual(result.weather[0].code, "FZDZ");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Blowing snow", "UKBB 161500Z 25012KT 4000 BLSN SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "BLSN");
    assert.strictEqual(result.weather[0].code, "BLSN");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Drifting snow", "UKBB 161500Z 25012KT 4000 DRSN SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "DRSN");
    assert.strictEqual(result.weather[0].code, "DRSN");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Snow showers", "UKBB 161500Z 25012KT 4000 SHSN SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "SHSN");
    assert.strictEqual(result.weather[0].code, "SHSN");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Thunderstorm with snow", "UKBB 161500Z 25012KT 4000 TSSN SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "TSSN");
    assert.strictEqual(result.weather[0].code, "TSSN");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Heavy thunderstorm rain", "UKBB 161500Z 25012KT 3000 +TSRA SCT015 18/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "+TSRA");
    assert.strictEqual(result.weather[0].code, "+TSRA");
    assert.strictEqual(result.weather[0].intensity, "heavy");
});

/**/
test("Hail showers", "UKBB 161500Z 25012KT 3000 SHGR SCT015 18/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "SHGR");
    assert.strictEqual(result.weather[0].code, "SHGR");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Heavy snow", "UKBB 161500Z 25012KT 3000 +SN SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "+SN");
    assert.strictEqual(result.weather[0].code, "+SN");
    assert.strictEqual(result.weather[0].intensity, "heavy");
});


/**/
test("Light snow", "UKBB 161500Z 25012KT 3000 -SN SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "-SN");
    assert.strictEqual(result.weather[0].code, "-SN");
    assert.strictEqual(result.weather[0].intensity, "light");
});

/**/
test("Moderate snow", "UKBB 161500Z 25012KT 3000 SN SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "SN");
    assert.strictEqual(result.weather[0].code, "SN");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Heavy drizzle", "UKBB 161500Z 25012KT 2000 +DZ SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "+DZ");
    assert.strictEqual(result.weather[0].code, "+DZ");
    assert.strictEqual(result.weather[0].intensity, "heavy");
});

/**/
test("Light drizzle", "UKBB 161500Z 25012KT 2000 -DZ SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "-DZ");
    assert.strictEqual(result.weather[0].code, "-DZ");
    assert.strictEqual(result.weather[0].intensity, "light");
});

/**/
test("Moderate drizzle", "UKBB 161500Z 25012KT 2000 DZ SCT015 02/01 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "DZ");
    assert.strictEqual(result.weather[0].code, "DZ");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Heavy fog", "UKBB 161500Z 25012KT 0500 +FG SCT002 12/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "+FG");
    assert.strictEqual(result.weather[0].code, "+FG");
    assert.strictEqual(result.weather[0].intensity, "heavy");
});

/**/
test("Light fog", "UKBB 161500Z 25012KT 0500 -FG SCT002 12/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "-FG");
    assert.strictEqual(result.weather[0].code, "-FG");
    assert.strictEqual(result.weather[0].intensity, "light");
});

/**/
test("Moderate fog", "UKBB 161500Z 25012KT 0500 FG SCT002 12/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "FG");
    assert.strictEqual(result.weather[0].code, "FG");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Heavy haze", "UKBB 161500Z 25012KT 3000 +HZ SCT015 18/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "+HZ");
    assert.strictEqual(result.weather[0].code, "+HZ");
    assert.strictEqual(result.weather[0].intensity, "heavy");
});

/**/
test("Light haze", "UKBB 161500Z 25012KT 3000 -HZ SCT015 18/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "-HZ");
    assert.strictEqual(result.weather[0].code, "-HZ");
    assert.strictEqual(result.weather[0].intensity, "light");
});

/**/
test("Moderate haze", "UKBB 161500Z 25012KT 3000 HZ SCT015 18/12 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "HZ");
    assert.strictEqual(result.weather[0].code, "HZ");
    assert.strictEqual(result.weather[0].intensity, null);
});

/**/
test("Mist", "UKBB 161500Z 25012KT 1500 BR SCT005 12/11 Q1012", result => {
    assert.strictEqual(result.weather[0].raw, "BR");
    assert.strictEqual(result.weather[0].code, "BR");
    assert.strictEqual(result.weather[0].intensity, null);
});

console.log("\nAll automated v0.1 tests passed.");