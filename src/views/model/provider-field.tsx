import { Form } from "@raycast/api";
import { useProviders } from "../../hooks/useProviders";

export function ProviderField(props: { value?: string; onChange: (value: string) => void; info?: string }) {
  const { settings, isLoading } = useProviders();
  return (
    <Form.Dropdown
      id="providerId"
      title="Provider"
      value={props.value ?? ""}
      onChange={props.onChange}
      info={props.info}
      isLoading={isLoading}
    >
      <Form.Dropdown.Item value="" title="Default Provider" />
      {settings.providers.map((p) => (
        <Form.Dropdown.Item key={p.id} value={p.id} title={p.name} />
      ))}
    </Form.Dropdown>
  );
}
