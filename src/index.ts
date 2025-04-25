import Configurator from './configurator.js';

import { AppConfig, Config, DbConfig } from './test-config-types.js';

const configurator = new Configurator(Config, './src/test-config.json');

console.log(configurator.getCurr());
console.log('hi');

const configToChange = new Config();
configToChange.app = new AppConfig();
configToChange.app.port = 1231;
configToChange.db = new DbConfig();
configToChange.db.port = 99;
try {
    configurator.change(configToChange, true);
} catch (err) {
    console.error(err);
}

console.log(configurator.getCurr());
console.log('hi');
