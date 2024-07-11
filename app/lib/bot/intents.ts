const greetingIntent = {
  name: "Greetings",
  sampleUtterances: [
    { utterance: "Hey" },
    { utterance: "Hey!" },
    { utterance: "Hi" },
    { utterance: "Hi!" },
    { utterance: "Hola" },
    { utterance: "Hola!" },
    { utterance: "Hello!" },
    { utterance: "Hello" },
  ],
  intentClosingSetting: {
    closingResponse: {
      messageGroupsList: [
        {
          message: {
            plainTextMessage: {
              value: "¡Hola! ¿En qué puedo ayudarte?",
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
      { utterance: "Mi dispositivo es {device} y quiero saber la {feature}" },
      {
        utterance:
          "Mi dispositivo es {device} y quiero saber la {feature} en {aggregation}",
      },
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
                    value: "¿Cuál es el nombre de tu dispositivo?",
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
                    value:
                      "¿Cuál es la característica que deseas consultar (temperatura, humedad)?",
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
                      "¿Qué tipo de información deseas obtener? (promedio, ultimo, rango, moda, mediana)",
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

const irrigationIntent = {
  name: "Irrigation",
  sampleUtterances: [
    { utterance: "Quiero regar mi planta" },
    { utterance: "Riego" },
    { utterance: "Regar" },
    { utterance: "Deseo regar mi planta" },
  ],
  intentClosingSetting: {
    closingResponse: {
      messageGroupsList: [
        {
          message: {
            plainTextMessage: {
              value: "¡Regando la planta!",
            },
          },
        },
      ],
    },
  },
  fulfillmentCodeHook: {
    enabled: true,
  },
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
                "Disculpa, no entendí tu solicitud. Por favor intenta de nuevo.",
            },
          },
        },
      ],
    },
  },
};

export { greetingIntent, getDataIntent, fallbackIntent, irrigationIntent };
