const solc = require('solc');
const path = require('path');
const fs = require('fs');
const {
  createInputData,
  getAllFilesInFolder,
  getSolidityVersion,
  solidityVersionEqual,
  FILE_VERSION_TO_COMPILER,
} = require('./compile');
const { formatCompileErrors } = require('./debug');

// const contractsToFetch = {
//   UniswapV2Factory: undefined,
//   UniswapV2Router02: undefined,
//   UniswapV2Pair: 'UniswapV2Factory',
// };

async function getContracts() {
  return Object.entries(FILE_VERSION_TO_COMPILER).reduce(
    async (acc, [fileVersion, compilerVersion]) => {
      const contractsFolderPath = path.resolve(__dirname, '..', 'contracts');
      const input = createInputData({
        sources: getAllFilesInFolder(contractsFolderPath).reduce(
          (acc, file) => {
            const fileName = path
              .relative(contractsFolderPath, file)
              .replace(/\\/g, '/');
            const source = fs.readFileSync(file, 'utf8');
            const solidityVersion = getSolidityVersion(source);

            if (solidityVersionEqual(solidityVersion, fileVersion)) {
              acc[fileName] = {
                content: source,
              };
            }

            return acc;
          },
          {}
        ),
      });

      const compiledInfo = await new Promise((resolve) => {
        solc.loadRemoteVersion(`v${compilerVersion}`, (err, solcSnapshot) => {
          if (err)
            throw new Error(
              `Error fetching solc version ${compilerVersion}: ${err}`
            );

          const c = JSON.parse(solcSnapshot.compile(JSON.stringify(input)));
          if (c.errors) console.error(formatCompileErrors(c));

          resolve(c);
        });
      });

      return {
        ...(await acc),
        ...compiledInfo.contracts,
      };
    },
    {}
  );
}

module.exports = getContracts;
