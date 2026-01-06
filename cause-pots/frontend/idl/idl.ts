/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/contract.json`.
 */
export type Contract = {
  "address": "CTtGEyhWsub71K9bDKJZbaBDNbqNk54fUuh4pLB8M5sR",
  "metadata": {
    "name": "contract",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addContributor",
      "docs": [
        "Add a contributor to the pot (authority only)"
      ],
      "discriminator": [
        125,
        221,
        162,
        182,
        191,
        26,
        206,
        219
      ],
      "accounts": [
        {
          "name": "pot",
          "writable": true
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "pot"
          ]
        }
      ],
      "args": [
        {
          "name": "newContributor",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "contribute",
      "docs": [
        "Contribute SOL to a pot"
      ],
      "discriminator": [
        82,
        33,
        68,
        131,
        32,
        0,
        205,
        95
      ],
      "accounts": [
        {
          "name": "pot",
          "writable": true
        },
        {
          "name": "potVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pot"
              }
            ]
          }
        },
        {
          "name": "contributorAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  116,
                  114,
                  105,
                  98,
                  117,
                  116,
                  111,
                  114
                ]
              },
              {
                "kind": "account",
                "path": "pot"
              },
              {
                "kind": "account",
                "path": "contributor"
              }
            ]
          }
        },
        {
          "name": "contributor",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createPot",
      "docs": [
        "Create a new savings pot with time-lock and multi-sig requirements"
      ],
      "discriminator": [
        232,
        45,
        123,
        181,
        204,
        121,
        131,
        9
      ],
      "accounts": [
        {
          "name": "pot",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "authority"
              },
              {
                "kind": "arg",
                "path": "name"
              }
            ]
          }
        },
        {
          "name": "potVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pot"
              }
            ]
          }
        },
        {
          "name": "authority",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "name",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "targetAmount",
          "type": "u64"
        },
        {
          "name": "unlockDays",
          "type": "i64"
        },
        {
          "name": "signersRequired",
          "type": "u8"
        }
      ]
    },
    {
      "name": "releaseFunds",
      "docs": [
        "Release funds to recipient (requires threshold signatures)"
      ],
      "discriminator": [
        225,
        88,
        91,
        108,
        126,
        52,
        2,
        26
      ],
      "accounts": [
        {
          "name": "pot",
          "writable": true
        },
        {
          "name": "potVault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "pot"
              }
            ]
          }
        },
        {
          "name": "authority",
          "signer": true,
          "relations": [
            "pot"
          ]
        },
        {
          "name": "recipient",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "recipient",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "signRelease",
      "docs": [
        "Sign to approve release (multi-sig)"
      ],
      "discriminator": [
        111,
        211,
        85,
        96,
        119,
        69,
        197,
        105
      ],
      "accounts": [
        {
          "name": "pot",
          "writable": true
        },
        {
          "name": "signer",
          "signer": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "contributorAccount",
      "discriminator": [
        14,
        30,
        60,
        53,
        185,
        245,
        180,
        86
      ]
    },
    {
      "name": "potAccount",
      "discriminator": [
        202,
        25,
        205,
        47,
        59,
        253,
        100,
        118
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "nameTooLong",
      "msg": "Pot name is too long (max 32 characters)"
    },
    {
      "code": 6001,
      "name": "descriptionTooLong",
      "msg": "Pot description is too long (max 200 characters)"
    },
    {
      "code": 6002,
      "name": "invalidTargetAmount",
      "msg": "Target amount must be greater than 0"
    },
    {
      "code": 6003,
      "name": "invalidSignersRequired",
      "msg": "Signers required must be greater than 0"
    },
    {
      "code": 6004,
      "name": "invalidAmount",
      "msg": "Contribution amount must be greater than 0"
    },
    {
      "code": 6005,
      "name": "potAlreadyReleased",
      "msg": "Pot has already been released"
    },
    {
      "code": 6006,
      "name": "timeLockNotExpired",
      "msg": "Time-lock period has not expired yet"
    },
    {
      "code": 6007,
      "name": "notAContributor",
      "msg": "You are not a contributor to this pot"
    },
    {
      "code": 6008,
      "name": "alreadySigned",
      "msg": "You have already signed the release"
    },
    {
      "code": 6009,
      "name": "insufficientSignatures",
      "msg": "Insufficient signatures for release"
    },
    {
      "code": 6010,
      "name": "alreadyAContributor",
      "msg": "Already a contributor"
    },
    {
      "code": 6011,
      "name": "insufficientFunds",
      "msg": "Insufficient funds in pot"
    },
    {
      "code": 6012,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "contributorAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "pot",
            "docs": [
              "References"
            ],
            "type": "pubkey"
          },
          {
            "name": "contributor",
            "type": "pubkey"
          },
          {
            "name": "totalContributed",
            "docs": [
              "Contribution tracking"
            ],
            "type": "u64"
          },
          {
            "name": "contributionCount",
            "type": "u32"
          },
          {
            "name": "lastContributionAt",
            "type": "i64"
          },
          {
            "name": "joinedAt",
            "docs": [
              "Metadata"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "potAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "docs": [
              "Creator and authority of the pot"
            ],
            "type": "pubkey"
          },
          {
            "name": "vault",
            "docs": [
              "Vault PDA that holds the actual SOL"
            ],
            "type": "pubkey"
          },
          {
            "name": "name",
            "docs": [
              "Pot metadata"
            ],
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "targetAmount",
            "docs": [
              "Financial details"
            ],
            "type": "u64"
          },
          {
            "name": "totalContributed",
            "type": "u64"
          },
          {
            "name": "unlockTimestamp",
            "docs": [
              "Time-lock"
            ],
            "type": "i64"
          },
          {
            "name": "signersRequired",
            "docs": [
              "Multi-sig configuration"
            ],
            "type": "u8"
          },
          {
            "name": "signatures",
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "contributors",
            "docs": [
              "Contributors list"
            ],
            "type": {
              "vec": "pubkey"
            }
          },
          {
            "name": "isReleased",
            "docs": [
              "Release status"
            ],
            "type": "bool"
          },
          {
            "name": "releasedAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "recipient",
            "type": {
              "option": "pubkey"
            }
          },
          {
            "name": "createdAt",
            "docs": [
              "Metadata"
            ],
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          },
          {
            "name": "vaultBump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
