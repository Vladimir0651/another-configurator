import Configurator from './configurator.js';

import { Config } from './test-config-types.js';

const configurator = new Configurator(Config, './src/test-config.json');
const config = configurator.getCurr();

console.log(config);
