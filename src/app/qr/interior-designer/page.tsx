import MobileLeadForm from "@/components/mobile/MobileLeadForm";

export default function InteriorDesignerQrPage() {
  return (
    <div className="h-full">
      <MobileLeadForm
        forcedPreference="Consulenza interior designer"
        headerTitle="Consulenza con Interior Designer in Omaggio"
        headerSubtitle="Lascia i tuoi dati: ti ricontatteremo per fissare una consulenza."
        submitLabel="Richiedi consulenza"
      />
    </div>
  );
}

