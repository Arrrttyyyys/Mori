import LifeRecords from "@/components/LifeRecords";
export default function Page() {
  return (
    <LifeRecords
      kind="story"
      title="Stories to keep"
      description="Stories shared during sessions arrive here as unverified. Confirm or edit them before Mori uses them as family context."
    />
  );
}
