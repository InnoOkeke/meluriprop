export const PropertiesRegistryABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_location",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_documentIPFS",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_valuation",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_targetRaise",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_totalTokens",
                "type": "uint256"
            },
            {
                "internalType": "enum PropertiesRegistry.Category",
                "name": "_category",
                "type": "uint8"
            }
        ],
        "name": "registerProperty",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_tokenId",
                "type": "uint256"
            }
        ],
        "name": "getProperty",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "string",
                        "name": "name",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "location",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "documentIPFS",
                        "type": "string"
                    },
                    {
                        "internalType": "uint256",
                        "name": "valuation",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "targetRaise",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "totalTokens",
                        "type": "uint256"
                    },
                    {
                        "internalType": "enum PropertiesRegistry.Category",
                        "name": "category",
                        "type": "uint8"
                    },
                    {
                        "internalType": "bool",
                        "name": "isActive",
                        "type": "bool"
                    }
                ],
                "internalType": "struct PropertiesRegistry.Property",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "tokenId",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "targetRaise",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "enum PropertiesRegistry.Category",
                "name": "category",
                "type": "uint8"
            }
        ],
        "name": "PropertyRegistered",
        "type": "event"
    }
] as const;
