import fs from 'fs';

import Configurator from '../src/index.ts';
import {
    LoadFileError,
    ParseError,
    ValidationError,
    NotSupportedFileExtError,
} from '../src/index.ts';
import { AppConfig, Config, DbConfig } from './config-types.ts';

test('Is global config loaded', () => {
    const configurator = new Configurator(Config, './tests/configs/good-config.json');
    expect(configurator.LoadedSource.isGlobal).toBe(true);
});

test('Is local config loaded', () => {
    const configurator = new Configurator(
        Config,
        './tests/configs/not-exists-config.json',
        './tests/configs/good-config.json',
    );
    expect(configurator.LoadedSource.isGlobal).toBe(false);
});

test(`Throws NotSupportedFileExtError when has bad File ext`, () => {
    expect(() => {
        new Configurator(Config, './tests/configs/good-config.badext');
    }).toThrow(new LoadFileError('Global config file loading error', NotSupportedFileExtError));
});

test(`Throws LoadFileError() when can't find a file`, () => {
    expect(() => {
        new Configurator(Config, './tests/configs/not-exists-config.json');
    }).toThrow(LoadFileError);
});

test(`Throws ParseError() when can't parse a file`, () => {
    expect(() => {
        new Configurator(Config, './tests/configs/bad-parse-config.json');
    }).toThrow(ParseError);
});

test(`Throws ValidationError() when has bad values`, () => {
    expect(() => {
        new Configurator(Config, './tests/configs/bad-values-config.json');
    }).toThrow(ValidationError);
});

test(`Changing configuration`, () => {
    const configurator = new Configurator(Config, './tests/configs/good-config.json');

    const changeings = new Config();
    changeings.db = new DbConfig();
    changeings.db.password = '654646464';
    changeings.db.port = 99;
    configurator.change(changeings);

    expect(configurator.CurrConfig.db.host).toBe('localhost');
    expect(configurator.CurrConfig.db.name).toBe('synthesprorp_db');
    expect(configurator.CurrConfig.db.user).toBe('postgres');
    expect(configurator.CurrConfig.db.password).toBe('654646464');
    expect(configurator.CurrConfig.db.port).toBe(99);
    expect(configurator.CurrConfig.logging.logDbQuereis).toBe(true);
});

test(`Changing can be persistence`, () => {
    const configurator = new Configurator(Config, './tests/configs/good-config.json');

    const changeings = new Config();
    changeings.db = new DbConfig();
    changeings.db.password = '654646464';
    changeings.db.port = 99;
    changeings.app = new AppConfig();
    changeings.app.port = 554;
    configurator.change(changeings, true);

    const newConfigurator = new Configurator(Config, './tests/configs/good-config.json');

    expect(newConfigurator.CurrConfig.db.host).toBe('localhost');
    expect(newConfigurator.CurrConfig.db.name).toBe('synthesprorp_db');
    expect(newConfigurator.CurrConfig.db.user).toBe('postgres');
    expect(newConfigurator.CurrConfig.db.password).toBe('654646464');
    expect(newConfigurator.CurrConfig.db.port).toBe(99);
    expect(newConfigurator.CurrConfig.app.port).toBe(554);
    expect(newConfigurator.CurrConfig.logging.logDbQuereis).toBe(true);
});

test(`Configuration is immutable`, () => {
    fs.rmSync('./runtime', { recursive: true });
    const configurator = new Configurator(Config, './tests/configs/good-config.json');
    const currConfig = configurator.CurrConfig;
    currConfig.db.host = 'somehost';
    currConfig.db.port = 11;
    expect(configurator.CurrConfig.db.host).toBe('localhost');
    expect(configurator.CurrConfig.db.port).toBe(5432);

    const defConfig = configurator.DefaultConfig;
    defConfig.app.port = 123;
    expect(configurator.DefaultConfig.app.port).toBe(3000);

    const loadedSource = configurator.LoadedSource;
    loadedSource.isGlobal = false;
    expect(configurator.LoadedSource.isGlobal).toBe(true);
});
