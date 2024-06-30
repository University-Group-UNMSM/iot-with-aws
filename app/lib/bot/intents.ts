const greetingIntent = {
  name: "Greetings",
  sampleUtterances: [
    { utterance: "Hi" },
    { utterance: "Hola" },
    { utterance: "Hello!" },
    { utterance: "Hello" },
  ],
  intentClosingSetting: {
    closingResponse: {
      messageGroupsList: [
        {
          message: {
            plainTextMessage: {
              value: "Hola, buen dia, como puedo ayudarte hoy?",
            },
          },
        },
      ],
    },
  },
};

const getDataIntent = (
  deviceTypeName: string,
  featureTypeName: string,
  aggregationTypeName: string
) => {
  return {
    name: "GetData",
    sampleUtterances: [
      { utterance: "Quiero saber informacion sobre mi dispositivo" },
      { utterance: "Quiero consultar la informacion de mi {device}" },
      { utterance: "Mi dispositivo es {device}" },
    ],
    slots: [
      {
        name: "device",
        slotTypeName: deviceTypeName,
        valueElicitationSetting: {
          slotConstraint: "Required",
          promptSpecification: {
            messageGroupsList: [
              {
                message: {
                  plainTextMessage: {
                    value: "Cual es tu dispositivo?",
                  },
                },
              },
            ],
            maxRetries: 2,
            allowInterrupt: true,
          },
        },
      },
      {
        name: "feature",
        slotTypeName: featureTypeName,
        valueElicitationSetting: {
          slotConstraint: "Required",
          promptSpecification: {
            messageGroupsList: [
              {
                message: {
                  plainTextMessage: {
                    value: "Cual es la caracteristica que deseas consultar?",
                  },
                },
              },
            ],
            maxRetries: 2,
            allowInterrupt: true,
          },
        },
      },
      {
        name: "aggregation",
        slotTypeName: aggregationTypeName,
        valueElicitationSetting: {
          slotConstraint: "Required",
          promptSpecification: {
            messageGroupsList: [
              {
                message: {
                  plainTextMessage: {
                    value:
                      "Que tipo de informacion deseas obtener? (promedio, minimo, maximo, ultima medicion)",
                  },
                },
              },
            ],
            maxRetries: 2,
            allowInterrupt: true,
          },
        },
      },
    ],
    slotPriorities: [
      {
        priority: 1,
        slotName: "device",
      },
      {
        priority: 2,
        slotName: "feature",
      },
      {
        priority: 3,
        slotName: "aggregation",
      },
    ],
    fulfillmentCodeHook: {
      enabled: true,
    },
  };
};

const fallbackIntent = {
  name: "FallbackIntent",
  description: "Default intent when no other intent matches",
  parentIntentSignature: "AMAZON.FallbackIntent",
  intentClosingSetting: {
    closingResponse: {
      messageGroupsList: [
        {
          message: {
            plainTextMessage: {
              value:
                "Disculpa, no entendi tu solicitud. Por favor intenta de nuevo.",
            },
          },
        },
      ],
    },
  },
};

export { greetingIntent, getDataIntent, fallbackIntent };
