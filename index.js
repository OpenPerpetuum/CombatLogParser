const FS = require('fs').promises;
const PATH = require('path');
const MOMENT = require('moment');

const DATA_FOLDER = './data';

const ENEMY_NAME_PREFIX = 'L10 Pitboss';

const stringContains = (s, sub) => s.indexOf(sub)!=-1;

/**
 * @param {string} line 
 */
const parseTimeStamp = (line) => {
    if(!line.startsWith('[')){
        return null;
    }
    const startIndex = line.indexOf('[');
    const endIndex = line.indexOf(']');
    if(startIndex < 0 || endIndex < 0){
        return null;
    }
    const stampStr = line.substring(startIndex+1, endIndex);
    return MOMENT.utc(stampStr, "HH:mm:ss");
}

/**
 * @param {string} line 
 * @returns 
 */
const parseDamage = (line) => {
    if(!stringContains(line, 'damage')){
        return 0;
    }
    const parts = line.split(' > ');
    if(parts.length!=3){
        return 0;
    }
    const dmgPart = parts.filter(p=>stringContains(p, 'damage'))[0];
    const delimited = dmgPart.split(' ').map(s=>s.trim());
    try{
        return Number(delimited[0]);
    }catch(err){
        console.log(err);
    }
    return 0; 
}

const parseBossName = (line) => line.split(' > ').filter(s=>stringContains(s, ENEMY_NAME_PREFIX))[0];

const sumReduce = (previousValue, currentValue) => previousValue + currentValue;

const run = async () => {
    let files = await FS.readdir('./data');
    files = files.filter(f=>f.endsWith('.log')).map(f=>PATH.join(DATA_FOLDER, f));
    for(const f of files){
        const data = await FS.readFile(f, "utf8");
        const lines = data.split('\n').filter(d=>stringContains(d, ENEMY_NAME_PREFIX));
        const bossName = parseBossName(lines[0]);
        const startTime = parseTimeStamp(lines[0]);
        const endTime = parseTimeStamp(lines[lines.length-1]);
        const diff = endTime - startTime;
        const dmgSum = lines.map(parseDamage).reduce(sumReduce);
        const dps = dmgSum/(diff/1000);
        console.log(`DPS OF ${bossName} is ${dps}`);
    }
};

run().then(()=>process.exit(0)).catch((err)=>{
    console.log(err);
    process.exit(1);
});