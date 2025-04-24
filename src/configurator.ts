import { plainToClass, ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';
import * as path from 'path';
import * as fs from 'fs';

const fileExt = 'json';
const NotEmplementedError = Error('Not emplemented yet');
const NotSupportedFileExt = Error(`Only '.${fileExt}' file extention supports`);
const defaultEncoding: BufferEncoding = 'utf-8';
const addsFileAdress = './runtime/config-adds.json';

export default class Configurator<TargetConfigClass> {
    constructor(ConfigClass: ClassConstructor<TargetConfigClass>, globalAdresses: string);
    constructor(
        ConfigClass: ClassConstructor<TargetConfigClass>,
        globalAdresses: string,
        localAdress: string,
    );
    constructor(
        ConfigClass: ClassConstructor<TargetConfigClass>,
        globalAdresses: string,
        localAdress: string,
        encoding: BufferEncoding,
    );
    constructor(
        ConfigClass: ClassConstructor<TargetConfigClass>,
        globalAdresses: string,
        localAdress?: string,
        encoding?: BufferEncoding,
    ) {
        this.encoding = encoding || defaultEncoding;
        let fileContent: string;

        try {
            fileContent = this.readFileSync(globalAdresses);
            this.adress = globalAdresses;
            this.isGlobal = true;
        } catch (err) {
            if (!localAdress) throw err;

            fileContent = this.readFileSync(localAdress);
            this.adress = localAdress;
            this.isGlobal = false;
        }

        let configObject;
        try {
            configObject = JSON.parse(fileContent);
        } catch (err) {
            throw new Error('File content parse error. Reason:\n' + JSON.stringify(err.message));
        }

        const configInstance = plainToClass(ConfigClass, configObject);

        const errors = validateSync(configInstance as typeof ConfigClass);
        if (errors.length > 0) {
            throw new Error('Configuration validation failed. Reason:\n' + JSON.stringify(errors));
        }

        this.defaultConfig = this.currConfig = configInstance;

        this.loadAdds(ConfigClass);
    }

    //#region Public

    public getCurr(): TargetConfigClass {
        return this.currConfig;
    }

    public getDefault(): TargetConfigClass {
        return this.defaultConfig;
    }

    public getAdds(): TargetConfigClass {
        return this.adds;
    }

    public getLoadedFrom(): { adress: string; isGlobal: boolean } {
        return { adress: this.adress, isGlobal: this.isGlobal };
    }

    public setValue(/*adress, value, saveToAdds*/): void {
        throw NotEmplementedError;
        /*
            const addrArr = adress.split('.');

            if (!replaceParamValue(currConfig, addrArr, value)) {
                throw new Error(`Adress of param '${adress}' not exists in config`);
            }

            if (saveToAdds) {
                let valInList = false;
                for (let i = 0; i < configAdds.length; i++) {
                    if (configAdds[i].key == adress) {
                        configAdds[i].value = value;
                        valInList = true;
                    }
                }

                if (!valInList) configAdds.push({ key: adress, value: value });

                const folderName = path.parse(configAddsFullAdress).dir;
                if (!fs.existsSync(folderName)) {
                    fs.mkdirSync(folderName);
                }
                fs.writeFileSync(configAddsFullAdress, JSON.stringify(configAdds), 'utf8');
            }
        */
    }

    //#endregion Public

    //#region Private

    private defaultConfig: TargetConfigClass;
    private currConfig: TargetConfigClass;
    private adress: string;
    private isGlobal: boolean;
    private adds: TargetConfigClass;
    private encoding: BufferEncoding;

    private readFileSync(fileName: string): string {
        const filePath = path.parse(fileName);
        if (filePath.ext != '.' + fileExt) throw NotSupportedFileExt;

        return fs.readFileSync(fileName, { encoding: this.encoding });
    }

    private loadAdds(ConfigClass: ClassConstructor<TargetConfigClass>): void {
        try {
            const fileContent = this.readFileSync(addsFileAdress);
            const tempPlainAdds = JSON.parse(fileContent);

            if (Object.keys(tempPlainAdds).length == 0) return;

            const tempAddsInstance = plainToClass(ConfigClass, tempPlainAdds);

            const temp = Object.assign(this.currConfig, tempAddsInstance);

            const errors = validateSync(temp as typeof ConfigClass);
            if (errors.length > 0) {
                throw new Error(
                    'Configuration adds validation failed. Reason:\n' + JSON.stringify(errors),
                );
            }

            this.currConfig = temp;
        } catch (err) {
            //const message = (err as Error).message;
            // TODO: Выкимдывай ошибку эмиттером
            console.error(err);
            return;
        }
    }

    private applyAdds(/*adds*/) {
        /*
            adds.forEach((add) => {
                replaceParamValue(currConfig, add.key.split('.'), add.value);
            });
        */

        throw NotEmplementedError;
    }

    private replaceParamValue(/*obj, adressArr, value*/) {
        /*
            for (const key in obj) {
                if (adressArr[0] && key == adressArr[0]) {
                    if (typeof obj[key] === 'object' && obj[key] !== null) {
                        return replaceParamValue(obj[key], adressArr.slice(1), value);
                    } else {
                        if (adressArr.length == 1) {
                            obj[key] = value;
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }
         */

        throw NotEmplementedError;
    }

    //#endregion Private
}
