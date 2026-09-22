import React, { useEffect, useRef, useState } from 'react';
import { decodeQrFromImageData, decodeQrFromFile, SAMPLE_QR_PRESETS, SampleQrPreset } from '../utils/qrDecoder';

interface QrScannerSectionProps {
  onQrDetected: (decodedText: string) => void;
  initialValue?: string;
}

export const QrScannerSection: React.FC<QrScannerSectionProps> = ({ onQrDetected, initialValue = '' }) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scannedPayload, setScannedPayload] = useState<string>(initialValue);
  const [isScanningActive, setIsScanningActive] = useState<boolean>(true);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [decodeError, setDecodeError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialize offscreen canvas
  useEffect(() => {
    offscreenCanvasRef.current = document.createElement('canvas');
  }, []);

  // Update internal state when prop changes
  useEffect(() => {
    if (initialValue) {
      setScannedPayload(initialValue);
    }
  }, [initialValue]);

  // Handle Camera Stream Lifecycle
  useEffect(() => {
    let isCancelled = false;

    async function startCamera() {
      if (activeTab !== 'camera' || !isScanningActive) {
        stopCamera();
        return;
      }

      setCameraError(null);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access is not supported by your browser environment. Please use file upload below.');
        setActiveTab('upload');
        return;
      }

      try {
        stopCamera();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          startScanningLoop();
        }
      } catch (err: any) {
        console.warn('Camera permission or device error:', err);
        const errorMsg =
          err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
            ? 'Camera permission was denied. You can still scan by uploading an image or screenshot below.'
            : 'Unable to access camera feed. You can upload an image or select a sample QR code.';
        setCameraError(errorMsg);
        setActiveTab('upload');
      }
    }

    startCamera();

    return () => {
      isCancelled = true;
      stopCamera();
    };
  }, [activeTab, facingMode, isScanningActive]);

  const stopCamera = () => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const startScanningLoop = () => {
    let barcodeDetectorInstance: any = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorInstance = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        barcodeDetectorInstance = null;
      }
    }

    const scanFrame = () => {
      const video = videoRef.current;
      const canvas = offscreenCanvasRef.current;

      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        // Try hardware-accelerated BarcodeDetector on video element first
        if (barcodeDetectorInstance) {
          barcodeDetectorInstance
            .detect(video)
            .then((barcodes: any[]) => {
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                const decoded = barcodes[0].rawValue;
                setScannedPayload(decoded);
                onQrDetected(decoded);
                setIsScanningActive(false);
                stopCamera();
              }
            })
            .catch(() => {});
        }

        // Standard jsQR decoding via offscreen canvas
        if (canvas) {
          const width = video.videoWidth;
          const height = video.videoHeight;

          if (width > 0 && height > 0) {
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, width, height);
              const imageData = ctx.getImageData(0, 0, width, height);
              const decoded = decodeQrFromImageData(imageData);

              if (decoded) {
                setScannedPayload(decoded);
                onQrDetected(decoded);
                setIsScanningActive(false);
                stopCamera();
                return;
              }
            }
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);
  };

  const handleFileUpload = async (file: File) => {
    setDecodeError(null);
    const previewUrl = URL.createObjectURL(file);
    setUploadedPreview(previewUrl);

    const result = await decodeQrFromFile(file);
    if (result) {
      setScannedPayload(result);
      onQrDetected(result);
    } else {
      setDecodeError('No clear QR code detected in this image. Try another photo or a sample preset.');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSelectPreset = (preset: SampleQrPreset) => {
    setScannedPayload(preset.payload);
    setUploadedPreview(null);
    setDecodeError(null);
    onQrDetected(preset.payload);
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleRescan = () => {
    setScannedPayload('');
    setUploadedPreview(null);
    setDecodeError(null);
    setIsScanningActive(true);
  };

  return (
    <div className="qr-scanner-wrapper" id="qr-scanner-component">
      {/* Scanner Mode Toggle */}
      <div className="qr-switch-bar">
        <button
          type="button"
          className={`qr-tab ${activeTab === 'camera' ? 'active' : ''}`}
          id="qr-tab-camera"
          onClick={() => {
            setActiveTab('camera');
            setIsScanningActive(true);
          }}
        >
          📷 Live Camera
        </button>
        <button
          type="button"
          className={`qr-tab ${activeTab === 'upload' ? 'active' : ''}`}
          id="qr-tab-upload"
          onClick={() => {
            setActiveTab('upload');
            stopCamera();
          }}
        >
          📁 Upload Image / Preset
        </button>
      </div>

      {/* Live Camera Viewfinder */}
      {activeTab === 'camera' && (
        <div className="qr-scanner-box">
          <div className="qr-video-wrap">
            <video
              ref={videoRef}
              className="qr-video"
              muted
              playsInline
              autoPlay
            />
            <div className="qr-reticle">
              <span className="qr-corner tl" />
              <span className="qr-corner tr" />
              <span className="qr-corner bl" />
              <span className="qr-corner br" />
              <div className="qr-laser" />
            </div>
          </div>

          <div
            style={{
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: 'rgba(0,0,0,0.5)',
            }}
          >
            <span style={{ fontSize: '12px', color: '#BFE6B2', fontWeight: 600 }}>
              Point camera at any QR code
            </span>
            <button
              type="button"
              className="backbtn"
              style={{ padding: '6px 12px', fontSize: '12px', background: '#222', color: '#fff', border: '1px solid #444' }}
              onClick={toggleFacingMode}
            >
              🔄 Flip Camera
            </button>
          </div>
        </div>
      )}

      {/* Upload & Preset View */}
      {activeTab === 'upload' && (
        <div>
          {cameraError && (
            <div
              style={{
                background: 'var(--amber-soft)',
                border: '1px solid #F0DFC0',
                borderRadius: '16px',
                padding: '12px 16px',
                fontSize: '13px',
                color: 'var(--ink2)',
                marginBottom: '14px',
                lineHeight: 1.45,
              }}
            >
              ⚠️ {cameraError}
            </div>
          )}

          <div
            className={`qr-upload-zone ${isDragOver ? 'dragover' : ''}`}
            id="qr-dropzone"
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('qr-file-input')?.click()}
          >
            <input
              type="file"
              id="qr-file-input"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileInputChange}
            />
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '14px',
                background: 'var(--accent-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-d)',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h3v3h-3zM20 14h1M14 20h1M20 20h1" />
              </svg>
            </div>
            <div>
              <b style={{ fontSize: '14.5px' }}>Click or drop QR image here</b>
              <p className="sub" style={{ marginTop: '2px', fontSize: '12.5px' }}>
                Supports PNG, JPG, WEBP, or mobile screenshots
              </p>
            </div>
          </div>

          {uploadedPreview && (
            <div
              style={{
                marginTop: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px',
                borderRadius: '14px',
                background: '#fff',
                border: '1px solid var(--line)',
              }}
            >
              <img
                src={uploadedPreview}
                alt="QR Preview"
                style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #eee' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700 }}>Scanned Image Loaded</div>
                <div style={{ fontSize: '11.5px', color: 'var(--ink3)' }}>Image decoded with jsQR</div>
              </div>
            </div>
          )}

          {decodeError && (
            <div
              style={{
                marginTop: '10px',
                color: 'var(--red)',
                fontSize: '12.5px',
                fontWeight: 600,
                padding: '8px 12px',
                background: 'var(--red-soft)',
                borderRadius: '12px',
              }}
            >
              {decodeError}
            </div>
          )}
        </div>
      )}

      {/* Scanned Decoded Payload Display */}
      {scannedPayload ? (
        <div
          style={{
            marginTop: '14px',
            background: 'var(--card)',
            border: '1.5px solid var(--line)',
            borderRadius: '18px',
            padding: '14px 16px',
            boxShadow: 'var(--shadow)',
          }}
          id="qr-detected-box"
        >
          <div className="row" style={{ marginBottom: '6px' }}>
            <span className="tag green" style={{ fontSize: '11px', padding: '3px 10px' }}>
              ✓ Decoded QR Content
            </span>
            <span className="spacer"></span>
            <button
              type="button"
              className="backbtn"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={handleRescan}
            >
              Scan Another QR
            </button>
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              background: '#F6FAF6',
              padding: '10px 12px',
              borderRadius: '12px',
              border: '1px solid #DCECDD',
              wordBreak: 'break-all',
              color: 'var(--ink)',
              maxHeight: '120px',
              overflowY: 'auto',
            }}
          >
            {scannedPayload}
          </div>
        </div>
      ) : null}

      {/* Quick Test QR Presets */}
      <div style={{ marginTop: '16px' }}>
        <div className="sec" style={{ margin: '14px 0 10px', fontSize: '14px' }}>
          Or test with sample QR payloads:
        </div>
        <div className="chips">
          {SAMPLE_QR_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="chip"
              id={`preset-${preset.id}`}
              onClick={() => handleSelectPreset(preset)}
              title={preset.description}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
