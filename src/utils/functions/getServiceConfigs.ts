import getAllServiceConfigs from "./getAllServiceConfigs";

export default async function getServiceConfigs(service: string) {
  const allConfigs = await getAllServiceConfigs();

  const specificConfig = allConfigs.find(
    (config) => config.process_id === service
  );

  if (!specificConfig) {
    throw new Error(`Service config not found for service: ${service}`);
  }

  return specificConfig;
}
