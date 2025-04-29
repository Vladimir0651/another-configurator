import {
    plainToClass,
    ClassConstructor,
    instanceToPlain,
    instanceToInstance,
} from 'class-transformer';
import { validateSync, ValidationError as InnerValidationError } from 'class-validator';
import * as path from 'path';
import * as fs from 'fs';

export const fileExt = 'json';
export const NotSupportedFileExtError = Error(`Only '.${fileExt}' file extention supports`);
export const defaultEncoding: BufferEncoding = 'utf-8';
export const addsFileAdress = './runtime/config-adds/config-adds.json';

export class Configurator<TargetConfigClass> {
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
        } catch /*(err)*/ {
            //console.error(err);
            //My be need emit error to log warning
            this.adds = new this.ClassType();
        }
    }

    //#region Public

    public get CurrConfig() {
        return instanceToInstance(this.currConfig);
    }

    public get DefaultConfig() {
        return instanceToInstance(this.defaultConfig);
    }

    public get Adds() {
        return instanceToInstance(this.adds);
    }

    public get LoadedSource(): { adress: string; isGlobal: boolean } {
        return { adress: this.adress, isGlobal: this.isGlobal };
    }

    public change(newValuesConfig: TargetConfigClass, persistent: boolean = false): void {
        const tempAdds = this.merge(this.adds, newValuesConfig);
        const tempCurrConfig = this.merge(this.currConfig, tempAdds);

        const errors = validateSync(tempCurrConfig as typeof this.ClassType);
        if (errors.length > 0) {
            throw new ValidationError('New adds validation failed', errors);
        }

        this.currConfig = tempCurrConfig;
        this.adds = tempAdds;

        if (persistent) {
            this.writeAddsSync(this.adds);
        }
    }

    //#endregion Public

    //#region Private

    private readonly defaultConfig: TargetConfigClass;
    private readonly adress: string;
    private readonly isGlobal: boolean;
    private readonly encoding: BufferEncoding;
    private readonly ClassType: ClassConstructor<TargetConfigClass>;
    private adds: TargetConfigClass;
    private currConfig: TargetConfigClass;

    private readFileSync(fileName: string): string {
        const filePath = path.parse(fileName);
        if (filePath.ext != '.' + fileExt) throw NotSupportedFileExtError;

        return fs.readFileSync(fileName, { encoding: this.encoding });
    }

    private writeAddsSync(adds: TargetConfigClass): void {
        const dirName = path.parse(addsFileAdress).dir;
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
        }

        fs.writeFileSync(addsFileAdress, JSON.stringify(adds), this.encoding);
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

        const addsInstance = plainToClass(ConfigClass, addsPlain, {
            excludeExtraneousValues: true,
        });
        if (Object.keys(addsInstance as object).length == 0)
            throw new EmptyAddsError('Adds instance has no appropriate props');

        const tempCurrConfig = this.merge(this.CurrConfig, addsInstance);

        const errors = validateSync(tempCurrConfig as typeof ConfigClass);
        if (errors.length > 0) {
            throw new ValidationError('Adds validation failed', errors);
        }

        return { newConfig: tempCurrConfig, adds: addsInstance };
    }

    private merge(target: TargetConfigClass, source: TargetConfigClass): TargetConfigClass {
        const targetPlant = instanceToPlain(target, { exposeUnsetFields: true });
        const sourcePlant = instanceToPlain(source, { exposeUnsetFields: true });

        this.mergeRecursiveNoUndef(targetPlant, sourcePlant);

        const retPlant = plainToClass(this.ClassType, targetPlant, {
            excludeExtraneousValues: true,
            exposeUnsetFields: true,
        });

        this.delUnefProps(retPlant as object);

        return retPlant;
    }

    private delUnefProps(target: object) {
        for (const p in target) {
            if (target[p] === undefined) delete target[p];
            else if (typeof target[p] == 'object') {
                this.delUnefProps(target[p]);
            }
        }
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
    public cause: undefined | Error | Error[];
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
