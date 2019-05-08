const isAddress = require('./utils/address-utils').isAddress;
const colors = require('./utils/colors');
const isValidContract = require('./utils/contract-utils').isValidContract;
const isValidBytecode = require('./utils/contract-utils').isValidBytecode;
const handleRejection = require('./utils/global-exception-handling').handleRejection;
const handleException = require('./utils/global-exception-handling').handleException;
const isValidLibrary = require('./utils/linking-utils').isValidLibrary;
const linkLibrary = require('./utils/linking-utils').linkLibrary;
const isNumber = require('./utils/number-utils').isNumber;
const isProvider = require('./utils/provider-utils').isProvider;
const isSigner = require('./utils/signer-utils').isSigner;
const isUrl = require('./utils/url-utils').isUrl;


module.exports = {
    isAddress,
    colors,
    isValidContract,
    isValidBytecode,
    handleRejection,
    handleException,
    isValidLibrary,
    linkLibrary,
    isNumber,
    isProvider,
    isSigner,
    isUrl
}