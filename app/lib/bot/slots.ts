const deviceTypeName = {
  name: "deviceType",
  parentSlotTypeSignature: "AMAZON.AlphaNumeric",
  valueSelectionSetting: {
    resolutionStrategy: "ORIGINAL_VALUE",
    regexFilter: {
      pattern: "[a-z]{1,10}",
    },
  },
};

const featureTypeName = {
  name: "featureType",
  valueSelectionSetting: {
    resolutionStrategy: "TOP_RESOLUTION",
  },
  slotTypeValues: [
    {
      sampleValue: {
        value: "temperatura",
      },
    },
    {
      sampleValue: {
        value: "humedad",
      },
    },
  ],
};

const aggregationTypeName = {
  name: "aggregationType",
  valueSelectionSetting: {
    resolutionStrategy: "ORIGINAL_VALUE",
  },
  slotTypeValues: [
    {
      sampleValue: {
        value: "media",
      },
    },
    {
      sampleValue: {
        value: "promedio",
      },
    },
    {
      sampleValue: {
        value: "moda",
      },
    },
    {
      sampleValue: {
        value: "rango",
      },
    },
    {
      sampleValue: {
        value: "ultimo",
      },
    },
  ],
};

export { deviceTypeName, featureTypeName, aggregationTypeName };
