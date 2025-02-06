const fs    = require('fs');
const path  = require('path');

const defaultConfigAddsFileName  = 'configadds';
const configAddsFileExt  = 'json';

let defaultConfig               = null;
let currConfig                  = null;
let configAdds                  = null;
let loadedAdress                = null;
let configAddsFullAdress        = null;
let isGlobalConfigAdressLoaded  = null;
let chechConfigFunc             = null;

//#region Public

    module.exports = Configurator;
    function Configurator (globalAdresses, localAdress, configAddsAdress, configAddsFileName, chechConfigFunction)
    {
        if(chechConfigFunction && typeof(chechConfigFunction) != 'function')
            throw new TypeError(`Param 'chechConfigFunction' must be a function, got ${typeof(chechConfigFunction)}`);

        if(chechConfigFunction)
            chechConfigFunc = chechConfigFunction;


        if(!configAddsAdress)
            configAddsAdress = path.resolve('./');

        if(!configAddsFileName)
            configAddsFileName = defaultConfigAddsFileName;

        configAddsFullAdress = path.join(configAddsAdress, configAddsFileName + '.' + configAddsFileExt);

        let loadedAdr;
        let tempConfig;
        try {
            tempConfig = require(globalAdresses);
            loadedAdr = globalAdresses;
            isGlobalConfigAdressLoaded = true;
        }
        catch(err)
        {
            try {
                tempConfig = require(localAdress);
                loadedAdr = localAdress;
                isGlobalConfigAdressLoaded = false;
            }
            catch(err2)
            {
                if(!err2.cause)
                    err2.cause = err;
                const localAdrrError = new Error(`Config loading error at address '${localAdress}'`, {cause: err2});
                throw localAdrrError;
            }
        }

        try {
            checkConfig(tempConfig);
        }
        catch(err)
        {
            throw new Error(`Config checking error at address '${loadedAdr}'`, { cause: err });
        }

        defaultConfig = currConfig = tempConfig;

        configAdds = loadAdds();

        if(configAdds)
            applyAdds(configAdds);

        loadedAdress = loadedAdr;
    };

    Configurator.prototype.check = checkConfig;

    Configurator.prototype.getCurr = function()
    {
        return Object.assign({}, currConfig);
    }

    Configurator.prototype.getDefault = function()
    {
        return Object.assign({}, defaultConfig);
    }

    Configurator.prototype.getAdds = function()
    {
        return Object.assign({}, configAdds);
    }

    Configurator.prototype.getAdress = function()
    {
        return {adress: loadedAdress, isGlobal: isGlobalConfigAdressLoaded};
    }

    Configurator.prototype.setValue = function(adress, value, saveToAdds)
    {
        const addrArr = adress.split('.');

        if(!replaceParamValue(currConfig, addrArr, value))
        {
            throw new Error(`Adress of param '${adress}' not exists in config`);
        }

        if(saveToAdds)
        {
            let valInList = false;
            for(let i = 0; i < configAdds.length; i++)
            {
                if(configAdds[i].key == adress)
                {
                    configAdds[i].value = value;
                    valInList = true;
                }
            }

            if(!valInList)
                configAdds.push({key: adress, value: value});

            
            const folderName =  path.parse(configAddsFullAdress).dir;
            if (!fs.existsSync(folderName)) 
            {
                fs.mkdirSync(folderName);
            }
            fs.writeFileSync(configAddsFullAdress, JSON.stringify(configAdds), 'utf8')
        }
    }

//#endregion Public

//#region Private

    function loadAdds()
    {
        let configAdds;
        try {
            configAdds = require(configAddsFullAdress);
        }
        catch(err)
        { return []; }

        try {
            configAdds = checkAdds(configAdds);
        }
        catch(err)
        { return []; }

        return configAdds;
    }

    function checkConfig(conf)
    {
        if(chechConfigFunc)
            chechConfigFunc.call(conf);
    }

    function checkAdds(confAdds)
    {
        //throw new Error('DEBUG!');
        return confAdds;
    }

    function applyAdds(adds)
    {
        adds.forEach(add =>
        {
            replaceParamValue(currConfig, add.key.split('.'), add.value);
        });
    }

    function replaceParamValue(obj, adressArr, value)
    {
        for (let key in obj)
        {
            if(adressArr[0] && key == adressArr[0])
            {
                if (typeof obj[key] === 'object' && obj[key] !== null)
                {
                    return replaceParamValue(obj[key], adressArr.slice(1), value);
                }
                else
                {
                    if(adressArr.length == 1)
                    {
                        obj[key] = value;
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                }
            }
        }
    }

//#endregion Private