import Configurator from '../src/index.ts';
import { LoadFileError } from '../src/index.ts';
import { AppConfig, Config, DbConfig } from './config-types.ts';

const configurator = new Configurator(Config, './tests/configs/good-config.json');

test('Is global config loaded', () => {
    expect(configurator.getLoadedFrom().isGlobal).toBe(true);
});

test(`Throws LoadFileError() when can't find a file`, () => {
    expect(() => {
        new Configurator(Config, './tests/configs/exists-file.json');
    }).toThrow(LoadFileError);
});

test(`Changing configuration`, () => {
    const configToChange = new Config();
    configToChange.app = new AppConfig();
    configToChange.app.port = 1231;
    configToChange.db = new DbConfig();
    configToChange.db.port = 99;
    configurator.change(configToChange, true);

    expect(configurator.getCurr().app.port).toBe(1231);
    expect(configurator.getCurr().db.port).toBe(99);
});
