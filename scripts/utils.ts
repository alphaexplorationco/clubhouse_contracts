import * as fs from 'fs';

export function saveContractAddress(contractName: string, chainId: number, address: string) {
    const jsonString = fs.readFileSync('../deploy.json','utf8');
    const deploy = JSON.parse(jsonString);
    deploy[chainId][contractName] = address
    fs.writeFileSync('./newCustomer.json', JSON.stringify(deploy))
  }
  