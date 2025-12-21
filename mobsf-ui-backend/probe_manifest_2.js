const axios = require('axios');
const fs = require('fs');

const API_KEY = 'eb9b4ba863563a010782da3e270aeb8f3babdfc1f22b6986da3cea5a00758ccd';
const HASH = 'aa76bd1becae0c3f8a70d2ecacc4b10d';
const URL_VIEW = 'http://localhost:8000/api/v1/view_source';
const URL_REPORT = 'http://localhost:8000/api/v1/report_json';

async function tryFetch(file, type) {
    try {
        const msg = `Trying file='${file}', type='${type}'...`;
        console.log(msg);
        fs.appendFileSync('probe_output_2.txt', msg + '\n');

        const params = new URLSearchParams();
        params.append('hash', HASH);
        params.append('file', file);
        params.append('type', type);

        const res = await axios.post(URL_VIEW, params.toString(), {
            headers: {
                'Authorization': API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const successMsg = `SUCCESS: Found content (length: ${res.data.data ? res.data.data.length : 'unknown'})`;
        console.log(successMsg);
        fs.appendFileSync('probe_output_2.txt', successMsg + '\n');
    } catch (err) {
        const failMsg = `FAILED: ${err.response ? JSON.stringify(err.response.data) : err.message}`;
        console.log(failMsg);
        fs.appendFileSync('probe_output_2.txt', failMsg + '\n');
    }
}

async function checkReport() {
    try {
        console.log(`Fetching report_json...`);
        fs.appendFileSync('probe_output_2.txt', 'Fetching report_json...\n');
        const params = new URLSearchParams();
        params.append('hash', HASH);

        const res = await axios.post(URL_REPORT, params.toString(), {
            headers: {
                'Authorization': API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        console.log(`SUCCESS: Got report`);
        const keys = Object.keys(res.data);
        fs.appendFileSync('probe_output_2.txt', 'Keys: ' + keys.join(', ') + '\n');

        if (res.data.manifest_xml) {
            fs.appendFileSync('probe_output_2.txt', 'Found manifest_xml! Length: ' + res.data.manifest_xml.length + '\n');
        } else {
            fs.appendFileSync('probe_output_2.txt', 'manifest_xml NOT found.\n');
        }
    } catch (err) {
        const failMsg = `FAILED Report: ${err.response ? JSON.stringify(err.response.data) : err.message}`;
        console.log(failMsg);
        fs.appendFileSync('probe_output_2.txt', failMsg + '\n');
    }
}

async function run() {
    fs.writeFileSync('probe_output_2.txt', 'Starting probe 2...\n');
    await tryFetch('resources/AndroidManifest.xml', 'apk');
    await checkReport();
}

run();
