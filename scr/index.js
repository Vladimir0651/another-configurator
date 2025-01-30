const fs    = require('fs');
const path  = require('path');

const defaultConfigAddsFileName  = 'configadds';
const configAddsFileExt  = 'json';
const notLoadedError = new Error(`Config is not loaded yet. Use load() to start it`);

let defaultConfig           = null;
let currConfig              = null;
let configAdds              = null;
let loadedAdress            = null;
let configAddsFullAdress    = null;

//#region Public

    module.exports.load = function(globalAdresses, localAdress, configAddsAdress, configAddsFileName)
    {
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
        }
        catch(err)
        {
            try {
                tempConfig = require(localAdress);
                loadedAdr = localAdress;
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
            defaultConfig = currConfig = checkConfig(tempConfig);
        }
        catch(err)
        {
            throw new Error(`Config checking error at address '${loadedAdr}'`, { cause: err });
        }

        configAdds = loadAdds();

        if(configAdds)
            applyAdds(configAdds);

        loadedAdress = loadedAdr;

        return loadedAdress;
    };

    module.exports.check = checkConfig;

    module.exports.getCurr = function()
    {
        if(!loadedAdress)
            throw notLoadedError;

        return Object.assign({}, currConfig);
    }

    module.exports.getDefault = function()
    {
        if(!loadedAdress)
            throw notLoadedError;

        return Object.assign({}, defaultConfig);
    }

    module.exports.getAdds = function()
    {
        if(!loadedAdress)
            throw notLoadedError;

        return Object.assign({}, configAdds);
    }

    module.exports.getAdress = function()
    {
        if(!loadedAdress)
            throw notLoadedError;

        return loadedAdress;
    }

    module.exports.setValue = function(adress, value, saveToAdds)
    {
        if(!loadedAdress)
            throw notLoadedError;

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
        //throw new Error('DEBUG!');
        return conf;
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