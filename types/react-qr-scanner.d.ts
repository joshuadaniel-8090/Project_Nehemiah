declare module "react-qr-scanner" {
  import { Component } from "react";

  interface QrScannerProps {
    delay?: number;
    style?: React.CSSProperties;
    videoStyle?: React.CSSProperties;
    constraints?: MediaTrackConstraints;
    onError?: (error: any) => void;
    onScan?: (data: string | null) => void;
    facingMode?: "user" | "environment";
    legacyMode?: boolean;
  }

  export default class QrScanner extends Component<QrScannerProps> {}
}
