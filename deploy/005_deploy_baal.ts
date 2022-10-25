import {HardhatRuntimeEnvironment} from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { deployContract } from '../src/hardhatDeployUtils';
import fs from "fs";
import path from "path";
import os from "os";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const shell = require('shelljs')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "autotaskUpdate"))
    shell.cd(path)
    shell.exec('git clone https://github.com/atomicptr/dauntless-builder')
    shell.exec('')
};
func.tags = ['test'];
export default func;