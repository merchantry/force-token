const path = require('path');
const fs = require('fs');
const solc = require('solc');
const { formatCompileErrors } = require('./utils/debug');
const {
  DEVELOPMENT_VERSION,
  getAllFilesInFolder,
  solidityVersionLessThan,
  getSolidityVersion,
  createInputData,
} = require('./utils/compile');

const input = createInputData({
  sources: getAllFilesInFolder(path.join(__dirname, 'contracts')).reduce(
    (acc, file) => {
      const fileName = file.split('contracts\\').pop().replace(/\\/g, '/');
      const source = fs.readFileSync(file, 'utf8');
      const solidityVersion = getSolidityVersion(source);

      if (!solidityVersionLessThan(solidityVersion, DEVELOPMENT_VERSION)) {
        acc[fileName] = {
          content: source,
        };
      }

      return acc;
    },
    {}
  ),
});

const compiledInfo = JSON.parse(solc.compile(JSON.stringify(input)));
if (compiledInfo.errors) console.error(formatCompileErrors(compiledInfo));

module.exports = compiledInfo.contracts;
