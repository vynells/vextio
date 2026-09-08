import VextioLoader from "@/components/VextioLoader";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-cream">
      <VextioLoader />
    </div>
  );
}
