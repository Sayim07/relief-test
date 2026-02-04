import Loader from "@/components/ui/Loader";

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-black/90 z-[9999] absolute inset-0">
            <Loader />
        </div>
    );
}
