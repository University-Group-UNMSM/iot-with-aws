export const createResourceName = (name: string) => {
  const project = "iot-stack";

  return `${project}-${name}`;
};
