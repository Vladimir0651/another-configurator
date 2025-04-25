import { plainToClass, ClassConstructor, instanceToPlain } from 'class-transformer';
import { validateSync, ValidationError as InnerValidationError } from 'class-validator';
import * as path from 'path';
import * as fs from 'fs';

const fileExt = 'json';
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
        this.ClassType = ConfigClass;
        this.encoding = encoding || defaultEncoding;
        let fileContent: string;

        try {
            fileContent = this.readFileSync(globalAdresses);
            this.adress = globalAdresses;
            this.isGlobal = true;
        } catch (err) {
            const globalFileLoadError = new LoadFileError('Global config file loading error', err);
            if (!localAdress) throw globalFileLoadError;

            try {
                fileContent = this.readFileSync(localAdress);
                this.adress = localAdress;
                this.isGlobal = false;
            } catch (err) {
                const lacalFileLoadError = new LoadFileError(
                    'Local config file loading error',
                    err,
                );
                throw lacalFileLoadError;
            }
        }

        let configPlant;
        try {
            configPlant = JSON.parse(fileContent);
        } catch (err) {
            throw new ParseError('Config file content parse error', err);
        }

        const configInstance = plainToClass(ConfigClass, configPlant, {
            excludeExtraneousValues: true,
        });

        const errors = validateSync(configInstance as typeof ConfigClass);
        if (errors.length > 0) {
            throw new ValidationError('Config validation failed', errors);
        }

        this.defaultConfig = this.currConfig = configInstance;

        try {
            const loaded = this.loadAdds(ConfigClass);
            this.currConfig = loaded.newConfig;
            this.adds = loaded.adds;
        } catch (err) {
            console.error(err);
            //TODO: Emit error
            this.adds = new this.ClassType(); // = ConfigClass;;
        }
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

    public change(newValuesConfig: TargetConfigClass, persistent: boolean = false): void {
        const newValuesPlantConfig = instanceToPlain(newValuesConfig);
        const tempCurrPlantConfig = instanceToPlain(this.currConfig);
        this.mergeRecursiveNoUndef(tempCurrPlantConfig, newValuesPlantConfig);

        const tempCurrConfig = plainToClass(this.ClassType, tempCurrPlantConfig, {
            excludeExtraneousValues: true,
        });

        const errors = validateSync(tempCurrConfig as typeof this.ClassType);
        if (errors.length > 0) {
            throw new ValidationError('New adds validation failed', errors);
        }

        this.currConfig = tempCurrConfig;
        this.mergeRecursiveNoUndef(this.adds as object, newValuesPlantConfig);

        //TODO: Emit changed strate { this.currConfig, newValuesConfig, newAdds: this.adds }

        if (persistent) {
            const folderName = path.parse(addsFileAdress).dir;

            if (!fs.existsSync(folderName)) {
                fs.mkdirSync(folderName, { recursive: true });
            }
            fs.writeFileSync(addsFileAdress, JSON.stringify(this.adds), this.encoding);
        }
    }

    //#endregion Public

    //#region Private

    private defaultConfig: TargetConfigClass;
    private currConfig: TargetConfigClass;
    private adress: string;
    private isGlobal: boolean;
    private adds: TargetConfigClass;
    private encoding: BufferEncoding;
    private ClassType: ClassConstructor<TargetConfigClass>;

    private readFileSync(fileName: string): string {
        const filePath = path.parse(fileName);
        if (filePath.ext != '.' + fileExt) throw NotSupportedFileExt;

        return fs.readFileSync(fileName, { encoding: this.encoding });
    }

    private loadAdds(ConfigClass: ClassConstructor<TargetConfigClass>): {
        newConfig: TargetConfigClass;
        adds: TargetConfigClass;
    } {
        let fileContent;
        try {
            fileContent = this.readFileSync(addsFileAdress);
        } catch (err) {
            throw new LoadFileError('Adds config file loading error', err);
        }

        let addsPlain;
        try {
            addsPlain = JSON.parse(fileContent);
        } catch (err) {
            throw new ParseError('Adds file content parce error', err);
        }
        if (Object.keys(addsPlain).length == 0)
            throw new EmptyAddsError('Adds platn object has no props');

        const tempCurrPlantConfig = instanceToPlain(this.currConfig);

        this.mergeRecursiveNoUndef(tempCurrPlantConfig, addsPlain);

        const tempCurrConfig = plainToClass(ConfigClass, tempCurrPlantConfig, {
            excludeExtraneousValues: true,
        });

        const errors = validateSync(tempCurrConfig as typeof ConfigClass);
        if (errors.length > 0) {
            throw new ValidationError('Adds validation failed', errors);
        }

        const addsInstance = plainToClass(ConfigClass, addsPlain, {
            excludeExtraneousValues: true,
        });
        if (Object.keys(addsInstance).length == 0)
            throw new EmptyAddsError('Adds instance has no appropriate props');

        return { newConfig: tempCurrConfig, adds: addsInstance };
    }

    private mergeRecursiveNoUndef(target: object, source: object): object {
        for (const p in source) {
            try {
                // Property in destination object set; update its value.
                if (typeof source[p] == 'object') {
                    target[p] = this.mergeRecursiveNoUndef(target[p], source[p]);
                } else {
                    if (source[p] !== undefined) target[p] = source[p];
                }
            } catch {
                // Property in destination object not set; create it and set its value.
                if (source[p] !== undefined) target[p] = source[p];
            }
        }

        return target;
    }

    //#endregion Private
}

export class EmptyAddsError extends Error {
    public cause: Error | Error[];
    constructor(message: string, cause?: Error | Error[]) {
        super(message);
        this.cause = cause;
        this.name = 'ParseError';
    }
}

export class ParseError extends Error {
    public cause: Error | Error[];
    constructor(message: string, cause: Error | Error[]) {
        super(message);
        this.cause = cause;
        this.name = 'ParseError';
    }
}

export class LoadFileError extends Error {
    public cause: Error | Error[];
    constructor(message: string, cause: Error | Error[]) {
        super(message);
        this.cause = cause;
        this.name = 'LoadFileError';
    }
}

export class ValidationError extends Error {
    public cause: Error | InnerValidationError | Error[] | InnerValidationError[];
    constructor(message: string, cause: Error | Error[] | InnerValidationError[]) {
        super(message);
        this.cause = cause;
        this.name = 'ValidationError';
    }
}
