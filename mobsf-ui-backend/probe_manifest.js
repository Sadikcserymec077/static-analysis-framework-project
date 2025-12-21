const axios = require('axios');
const fs = require('fs');

const API_KEY = 'eb9b4ba863563a010782da3e270aeb8f3babdfc1f22b6986da3cea5a00758ccd';
const HASH = 'aa76bd1becae0c3f8a70d2ecacc4b10d';
const URL = 'http://localhost:8000/api/v1/view_source';

async function tryFetch(file, type) {
    try {
        const msg = `Trying file='${file}', type='${type}'...`;
        console.log(msg);
        fs.appendFileSync('probe_output.txt', msg + '\n');

        const params = new URLSearchParams();
        params.append('hash', HASH);
        params.append('file', file);
        params.append('type', type);

        const res = await axios.post(URL, params.toString(), {
            headers: {
                'Authorization': API_KEY,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const successMsg = `SUCCESS: Found content (length: ${res.data.data ? res.data.data.length : 'unknown'})`;
        console.log(successMsg);
        fs.appendFileSync('probe_output.txt', successMsg + '\n');
        fs.appendFileSync('probe_output.txt', JSON.stringify(res.data).slice(0, 200) + '\n');
    } catch (err) {
        const failMsg = `FAILED: ${err.response ? JSON.stringify(err.response.data) : err.message}`;
        console.log(failMsg);
        fs.appendFileSync('probe_output.txt', failMsg + '\n');
    }
}

async function run() {
    fs.writeFileSync('probe_output.txt', 'Starting probe...\n');
    await tryFetch('AndroidManifest.xml', 'apk');
    await tryFetch('AndroidManifest.xml', 'studio');
    await tryFetch('AndroidManifest.xml', 'eclipse');
    await tryFetch('app/src/main/AndroidManifest.xml', 'studio');
}

run();
