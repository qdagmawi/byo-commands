// Compatibility for previously injected connection preferences. New connections live in provider profiles.
export type LegacyConnectionPreferences = {
  apiKey?: string;
  useApiEndpoint?: boolean;
  apiEndpoint?: string;
  useAzure?: boolean;
  azureEndpoint?: string;
  azureDeployment?: string;
};
