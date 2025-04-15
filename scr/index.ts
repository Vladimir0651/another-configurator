import { plainToClass, instanceToPlain, ClassConstructor } from 'class-transformer';
import { validateSync } from 'class-validator';
import * as fs from 'fs';

export default class Configurator<TargetConfigClass> {
    readonly NotEmplementedError = Error('Not emplemented yet');
    readonly defaultEncoding: BufferEncoding = 'utf-8';

    defaultConfig: TargetConfigClass;
    currConfig: TargetConfigClass;
    adress: string;
    isGlobal: boolean;

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
        let fileContent: string;

        try {
            fileContent = this.readFileSync(globalAdresses, encoding);
            this.adress = globalAdresses;
            this.isGlobal = true;
        } catch (err) {
            if (!localAdress) throw err;

            fileContent = this.readFileSync(localAdress, encoding);
            this.adress = localAdress;
            this.isGlobal = false;
        }

        const configObject = JSON.parse(fileContent);

        const configInstance = plainToClass(ConfigClass, configObject);

        const configPlanedInstance = instanceToPlain(configInstance);

        const errors = validateSync(configPlanedInstance);
        if (errors.length > 0) {
            throw new Error('Configuration validation failed: ' + JSON.stringify(errors));
        }

        this.defaultConfig = this.currConfig = configInstance;
    }

    //#region Public

    public getCurr(): TargetConfigClass {
        return this.currConfig;
    }

    public getDefault(): TargetConfigClass {
        return this.defaultConfig;
    }

    public getFrom(): { adress: string; isGlobal: boolean } {
        return { adress: this.adress, isGlobal: this.isGlobal };
    }

    public getAdds(): void {
        throw this.NotEmplementedError;
    }

    public setValue(/*adress, value, saveToAdds*/): void {
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

        throw this.NotEmplementedError;
    }

    //#endregion

    //#region Private

    private readFileSync(fileName: string, encoding?: BufferEncoding): string {
        const enc = encoding || this.defaultEncoding;
        return fs.readFileSync(fileName, { encoding: enc });
    }

    private loadAdds(): void {
        /*
            let configAdds;
            try {
                configAdds = require(configAddsFullAdress);
            } catch (err) {
                return [];
            }

            try {
                configAdds = checkAdds(configAdds);
            } catch (err) {
                return [];
            }

            return configAdds;
        */

        throw this.NotEmplementedError;
    }

    private checkConfig(/*conf*/) {
        /*
            if (chechConfigFunc) chechConfigFunc.call(conf);
        */

        throw this.NotEmplementedError;
    }

    private checkAdds(/*confAdds*/) {
        //throw new Error('DEBUG!');
        //return confAdds;

        throw this.NotEmplementedError;
    }

    private applyAdds(/*adds*/) {
        /*
            adds.forEach((add) => {
                replaceParamValue(currConfig, add.key.split('.'), add.value);
            });
        */

        throw this.NotEmplementedError;
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

        throw this.NotEmplementedError;
    }

    //#endregion
}
