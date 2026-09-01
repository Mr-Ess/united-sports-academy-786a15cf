import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff, Loader2 } from "lucide-react";

type Props = {
  onScan: (text: string) => void;
  onError?: (err: string) => void;
};

export function QrScanner({ onScan, onError }: Props) {
  const containerId = "qr-scanner-region";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop().catch(() => undefined);
      scannerRef.current?.clear();
      scannerRef.current = null;
    };
  }, []);

  async function start() {
    setLoading(true);
    try {
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (text) => {
          onScan(text);
        },
        () => undefined,
      );
      setActive(true);
    } catch (e) {
      onError?.((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function stop() {
    try {
      await scannerRef.current?.stop();
      scannerRef.current?.clear();
    } catch {
      /* ignore */
    }
    scannerRef.current = null;
    setActive(false);
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-black">ماسح QR</h3>
        {!active ? (
          <Button size="sm" onClick={start} disabled={loading}>
            {loading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Camera className="ml-2 h-4 w-4" />}
            تشغيل الكاميرا
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={stop}>
            <CameraOff className="ml-2 h-4 w-4" /> إيقاف
          </Button>
        )}
      </div>
      <div id={containerId} className="mx-auto max-w-sm overflow-hidden rounded-xl border bg-black/5" />
    </Card>
  );
}
