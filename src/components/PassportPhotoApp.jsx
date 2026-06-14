import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Upload,
  Download,
  RotateCcw,
  ZoomIn,
  Printer,
  Sun,
  Contrast,
  Palette,
  Check,
  Globe,
  FileImage,
  ChevronDown,
  AlertCircle,
  Camera,
  Sparkles,
  Shield,
  Zap,
} from "lucide-react";

const PassportPhotoApp = () => {
  const [step, setStep] = useState("landing");
  const [image, setImage] = useState(null);
  const [country, setCountry] = useState("US");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [photoCount, setPhotoCount] = useState(6);
  const [showGuides, setShowGuides] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [openFAQ, setOpenFAQ] = useState(null);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [autoMessage, setAutoMessage] = useState(null);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const printCanvasRef = useRef(null);

  // Print resolution: 300 dots per inch (1 inch = 25.4 mm)
  const PX_PER_MM = 300 / 25.4;
  const mmToPx = (mm) => Math.round(mm * PX_PER_MM);

  // Each country defines its OFFICIAL requirements, not just a pixel size:
  //  - widthMM / heightMM: physical photo size
  //  - head: [min, max] chin-to-crown height as a fraction of the photo height
  //  - eyeLine: where the eyes should sit, as a fraction from the top
  //  - bg: required background colour
  // These values come from each government's passport photo specification and
  // are what make the guides (and the requirements) genuinely differ per country.
  const countries = [
    {
      code: "US",
      name: "United States",
      flag: "🇺🇸",
      widthMM: 51,
      heightMM: 51,
      head: [0.5, 0.69],
      eyeLine: 0.4,
      bg: "#ffffff",
      note: '2×2 in. Head 25–35 mm (50–69% of height), eyes 28–35 mm from bottom. Plain white background.',
    },
    {
      code: "CA",
      name: "Canada",
      flag: "🇨🇦",
      widthMM: 50,
      heightMM: 70,
      head: [0.44, 0.51],
      eyeLine: 0.42,
      bg: "#ffffff",
      note: '50×70 mm. Face (chin to crown) 31–36 mm — a notably smaller head than US/UK. Plain white background.',
    },
    {
      code: "UK",
      name: "United Kingdom",
      flag: "🇬🇧",
      widthMM: 35,
      heightMM: 45,
      head: [0.64, 0.76],
      eyeLine: 0.45,
      bg: "#f3f4f0",
      note: '35×45 mm. Head (crown to chin) 29–34 mm (64–76%). Light grey / cream background.',
    },
    {
      code: "AU",
      name: "Australia",
      flag: "🇦🇺",
      widthMM: 35,
      heightMM: 45,
      head: [0.71, 0.8],
      eyeLine: 0.45,
      bg: "#ffffff",
      note: '35×45 mm. Face length 32–36 mm (71–80%). Plain white or light grey background.',
    },
    {
      code: "IN",
      name: "India",
      flag: "🇮🇳",
      widthMM: 51,
      heightMM: 51,
      head: [0.7, 0.8],
      eyeLine: 0.42,
      bg: "#ffffff",
      note: '2×2 in (51×51 mm). Face must fill 70–80% of the frame — much larger than the US head size. White background.',
    },
    {
      code: "CN",
      name: "China",
      flag: "🇨🇳",
      widthMM: 33,
      heightMM: 48,
      head: [0.58, 0.69],
      eyeLine: 0.45,
      bg: "#ffffff",
      note: '33×48 mm. Head 28–33 mm tall, 15–22 mm wide. White background.',
    },
    {
      code: "DE",
      name: "Germany",
      flag: "🇩🇪",
      widthMM: 35,
      heightMM: 45,
      head: [0.71, 0.8],
      eyeLine: 0.45,
      bg: "#f3f4f0",
      note: '35×45 mm (Schengen/ICAO). Head 32–36 mm (71–80%). Light grey background.',
    },
    {
      code: "FR",
      name: "France",
      flag: "🇫🇷",
      widthMM: 35,
      heightMM: 45,
      head: [0.71, 0.8],
      eyeLine: 0.45,
      bg: "#f3f4f0",
      note: '35×45 mm (Schengen/ICAO). Head 32–36 mm (71–80%). Light grey background.',
    },
  ];

  const currentCountry = countries.find((c) => c.code === country);

  const passportSize = useMemo(
    () => ({
      width: mmToPx(currentCountry.widthMM),
      height: mmToPx(currentCountry.heightMM),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [country]
  );

  // Derive the on-screen guide geometry from the country's real spec so the
  // oval, eye line and chin line always match that country's requirements.
  const guides = useMemo(() => {
    const headAvg = (currentCountry.head[0] + currentCountry.head[1]) / 2;
    const eye = currentCountry.eyeLine;
    // Eyes sit roughly 45% of the way down the head (crown -> chin).
    const crown = eye - 0.45 * headAvg;
    const chin = eye + 0.55 * headAvg;
    // A typical adult face is ~0.72 as wide as it is tall (chin to crown).
    const faceWidthPx = 0.72 * headAvg * passportSize.height;
    const ovalWidthPct = faceWidthPx / passportSize.width;
    return {
      headAvg,
      eye,
      crown: Math.max(0.02, crown),
      chin: Math.min(0.98, chin),
      ovalWidth: ovalWidthPct,
      ovalLeft: 0.5 - ovalWidthPct / 2,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, passportSize]);

  const pct = (v) => `${(v * 100).toFixed(1)}%`;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // The zoom slider is a multiplier relative to this baseline, NOT the raw
  // image pixels. baseScale makes the source photo "cover" the frame at zoom=1,
  // so the slider behaves the same whether the upload is 800px or 6000px wide.
  const baseScale = useMemo(() => {
    if (!image) return 1;
    return Math.max(
      passportSize.width / image.width,
      passportSize.height / image.height
    );
  }, [image, passportSize]);

  // Actual scale applied when drawing = baseline cover scale × user zoom.
  const effectiveScale = baseScale * scale;

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    try {
      let processedFile = file;

      const isHEIC =
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.name.toLowerCase().endsWith(".heic") ||
        file.name.toLowerCase().endsWith(".heif");

      if (isHEIC) {
        if (typeof window.heic2any === "undefined") {
          setError(
            "HEIC support not loaded. Please refresh the page and try again."
          );
          setIsProcessing(false);
          return;
        }

        try {
          const convertedBlob = await window.heic2any({
            blob: file,
            toType: "image/jpeg",
            quality: 0.9,
          });

          processedFile = Array.isArray(convertedBlob)
            ? convertedBlob[0]
            : convertedBlob;
        } catch (conversionError) {
          console.error("HEIC conversion error:", conversionError);
          setError(
            "Failed to convert HEIC image. Please try a JPEG or PNG file."
          );
          setIsProcessing(false);
          return;
        }
      } else if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file (JPEG, PNG, or HEIC).");
        setIsProcessing(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setStep("editor");
          setBrightness(100);
          setContrast(100);
          setSaturation(100);
          setScale(1);
          setPosition({ x: 0, y: 0 });
          setIsProcessing(false);
        };
        img.onerror = () => {
          setError("Failed to load image. Please try another file.");
          setIsProcessing(false);
        };
        img.src = e.target.result;
      };
      reader.onerror = () => {
        setError("Failed to read file. Please try again.");
        setIsProcessing(false);
      };
      reader.readAsDataURL(processedFile);
    } catch (err) {
      console.error("File processing error:", err);
      setError(
        "An error occurred while processing your file. Please try again."
      );
      setIsProcessing(false);
    }
  };

  const applyFilters = useCallback(() => {
    if (!image) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = passportSize.width;
    canvas.height = passportSize.height;

    ctx.fillStyle = currentCountry.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    const scaledWidth = image.width * effectiveScale;
    const scaledHeight = image.height * effectiveScale;

    ctx.drawImage(
      image,
      position.x + (canvas.width - scaledWidth) / 2,
      position.y + (canvas.height - scaledHeight) / 2,
      scaledWidth,
      scaledHeight
    );

    // Force preview canvas to update
    const previewCanvas = previewCanvasRef.current;
    if (previewCanvas) {
      const previewCtx = previewCanvas.getContext("2d");
      previewCanvas.width = passportSize.width;
      previewCanvas.height = passportSize.height;
      previewCtx.drawImage(canvas, 0, 0);
    }
  }, [
    image,
    brightness,
    contrast,
    saturation,
    effectiveScale,
    position,
    passportSize,
    currentCountry.bg,
  ]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // The canvas is displayed smaller than its internal resolution (max-w-full),
  // so convert pointer movement from CSS pixels into canvas pixels, otherwise
  // dragging moves the photo far less than the cursor and feels stuck.
  const pointerToCanvas = (e) => {
    const canvas = previewCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleMouseDown = (e) => {
    if (!image) return;
    setIsDragging(true);
    const p = pointerToCanvas(e);
    setDragStart({ x: p.x - position.x, y: p.y - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !image) return;
    const p = pointerToCanvas(e);
    setPosition({ x: p.x - dragStart.x, y: p.y - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetAdjustments = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setAutoMessage(null);
  };

  // Sample the image at low resolution to pick sensible exposure values.
  const computeAutoLevels = (img) => {
    const w = 80;
    const h = Math.max(1, Math.round((80 * img.height) / img.width));
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const cx = c.getContext("2d");
    cx.drawImage(img, 0, 0, w, h);
    const data = cx.getImageData(0, 0, w, h).data;
    const lum = [];
    let sum = 0;
    for (let i = 0; i < data.length; i += 4) {
      const l = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      lum.push(l);
      sum += l;
    }
    const mean = sum / lum.length;
    lum.sort((a, b) => a - b);
    const at = (q) => lum[clamp(Math.round(q * lum.length), 0, lum.length - 1)];
    const spread = Math.max(1, at(0.95) - at(0.05));
    return {
      brightness: Math.round(clamp((128 / Math.max(1, mean)) * 100, 70, 140)),
      contrast: Math.round(clamp((200 / spread) * 100, 85, 135)),
    };
  };

  // One-click auto adjust: fixes exposure, and (where the browser supports the
  // FaceDetector API) scales + positions the photo so the head fills the
  // country's required proportion with the eyes on the eye line.
  const autoAdjust = async () => {
    if (!image) return;
    setIsAdjusting(true);
    setAutoMessage(null);

    const { brightness: b, contrast: c } = computeAutoLevels(image);
    setBrightness(b);
    setContrast(c);
    setSaturation(100);

    let face = null;
    if (typeof window.FaceDetector !== "undefined") {
      try {
        const detector = new window.FaceDetector({
          maxDetectedFaces: 1,
          fastMode: true,
        });
        const faces = await detector.detect(image);
        if (faces && faces.length) face = faces[0].boundingBox;
      } catch (e) {
        face = null;
      }
    }

    const W = passportSize.width;
    const H = passportSize.height;

    const targetHeadPx = guides.headAvg * H;

    if (face) {
      // Detector boxes cover roughly forehead-to-chin (~78% of the full head),
      // so expand to estimate the full crown-to-chin head height.
      const fullHeadImgPx = face.height / 0.78;
      // Convert the required absolute draw scale into a zoom multiplier so it
      // stays in sync with the slider (zoom = drawScale / baseScale).
      const zoom = clamp(targetHeadPx / fullHeadImgPx / baseScale, 0.4, 3);
      const eff = baseScale * zoom;

      const faceCenterX = face.x + face.width / 2;
      const eyeImgY = face.y + 0.4 * face.height; // eyes ~40% down the face box

      const newX = W / 2 - (W - image.width * eff) / 2 - faceCenterX * eff;
      const newY =
        guides.eye * H - (H - image.height * eff) / 2 - eyeImgY * eff;

      setScale(parseFloat(zoom.toFixed(2)));
      setPosition({ x: Math.round(newX), y: Math.round(newY) });
      setAutoMessage("Face detected — head, eye line and exposure auto-set.");
    } else {
      // Fallback: assume a centred portrait where the head is ~45% of the frame
      // and scale so it meets the country's head size, then centre it.
      const assumedHeadFraction = 0.45;
      const zoom = clamp(
        targetHeadPx / (assumedHeadFraction * image.height) / baseScale,
        0.4,
        3
      );
      setScale(parseFloat(zoom.toFixed(2)));
      setPosition({ x: 0, y: 0 });
      setAutoMessage(
        "Exposure and size auto-set. Face detection isn't available in this browser — drag to fine-tune the position."
      );
    }

    setIsAdjusting(false);
  };

  const extractFaceArea = () => {
    if (!image) return null;

    const extractCanvas = document.createElement("canvas");
    const ctx = extractCanvas.getContext("2d");

    extractCanvas.width = passportSize.width;
    extractCanvas.height = passportSize.height;

    ctx.fillStyle = currentCountry.bg;
    ctx.fillRect(0, 0, extractCanvas.width, extractCanvas.height);

    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    const scaledWidth = image.width * effectiveScale;
    const scaledHeight = image.height * effectiveScale;

    ctx.drawImage(
      image,
      position.x + (extractCanvas.width - scaledWidth) / 2,
      position.y + (extractCanvas.height - scaledHeight) / 2,
      scaledWidth,
      scaledHeight
    );

    return extractCanvas.toDataURL("image/png", 1.0);
  };

  const generatePrintLayout = () => {
    const faceImage = extractFaceArea();
    if (!faceImage) return;

    const printCanvas = printCanvasRef.current;
    const ctx = printCanvas.getContext("2d");

    const printWidth = 1200;
    const printHeight = 1800;
    printCanvas.width = printWidth;
    printCanvas.height = printHeight;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, printWidth, printHeight);

    const img = new Image();
    img.onload = () => {
      const cols = 2;
      const rows = photoCount === 6 ? 3 : 2;

      const photoWidth = passportSize.width;
      const photoHeight = passportSize.height;

      const spacingX = (printWidth - cols * photoWidth) / (cols + 1);
      const spacingY = (printHeight - rows * photoHeight) / (rows + 1);

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (row * cols + col >= photoCount) break;

          const x = spacingX + col * (photoWidth + spacingX);
          const y = spacingY + row * (photoHeight + spacingY);

          ctx.strokeStyle = "#e0e0e0";
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, photoWidth, photoHeight);
          ctx.drawImage(img, x, y, photoWidth, photoHeight);
        }
      }
    };
    img.src = faceImage;
  };

  const downloadPrintLayout = () => {
    generatePrintLayout();
    setTimeout(() => {
      const link = document.createElement("a");
      link.download = `passport-photos-4x6-${country}-${photoCount}photos.png`;
      link.href = printCanvasRef.current.toDataURL("image/png", 1.0);
      link.click();
    }, 100);
  };

  const downloadSinglePhoto = () => {
    const faceImage = extractFaceArea();
    if (!faceImage) return;

    const link = document.createElement("a");
    link.download = `passport-photo-${country}.png`;
    link.href = faceImage;
    link.click();
  };

  // Landing Page
  if (step === "landing") {
    return (
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b border-gray-200 bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="w-8 h-8 text-emerald-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                PassportSnap
              </span>
            </div>
            <button
              onClick={() => setStep("upload")}
              className="px-6 py-2 bg-emerald-600 text-white rounded-full font-medium hover:bg-emerald-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
          <div className="max-w-7xl mx-auto px-4 py-20 lg:py-32">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Sparkles className="w-4 h-4" />
                  <span>Professional Quality Photos</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Perfect Passport Photos in
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {" "}
                    Minutes
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Create professional, compliant passport photos instantly. No
                  appointments, no waiting—just upload, edit, and download.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => setStep("upload")}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-xl font-semibold text-lg hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Create Your Photo →
                  </button>
                  <button className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg border-2 border-gray-200 hover:border-emerald-600 transition-all">
                    Learn More
                  </button>
                </div>
                <div className="mt-8 flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>100% Free</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>Instant Results</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-5 h-5 text-emerald-600" />
                    <span>8+ Countries</span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-2 hover:rotate-0 transition-transform">
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                    <Camera className="w-24 h-24 text-gray-400" />
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose PassportSnap?
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need for perfect passport photos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">
                Process your photos in seconds, not minutes. No waiting, no
                delays.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Private</h3>
              <p className="text-gray-600">
                All processing happens in your browser. We never see or store
                your photos.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Standards</h3>
              <p className="text-gray-600">
                Supports passport requirements for 8+ countries worldwide.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Printer className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Print Ready</h3>
              <p className="text-gray-600">
                High-resolution 300 DPI output perfect for any printer.
              </p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Simple Three-Step Process
              </h2>
              <p className="text-xl text-gray-600">
                From upload to download in under a minute
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center text-2xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-2xl font-semibold mb-3">Upload</h3>
                <p className="text-gray-600 mb-4">
                  Select your country and upload any portrait photo from your
                  device or phone.
                </p>
                <div className="flex items-center space-x-2 text-sm text-emerald-600">
                  <Check className="w-4 h-4" />
                  <span>Supports JPEG, PNG, HEIC</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-xl flex items-center justify-center text-2xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-2xl font-semibold mb-3">Edit</h3>
                <p className="text-gray-600 mb-4">
                  Position, resize, and adjust colors to meet official
                  requirements with our smart guides.
                </p>
                <div className="flex items-center space-x-2 text-sm text-teal-600">
                  <Check className="w-4 h-4" />
                  <span>Visual positioning guides</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-lg">
                <div className="w-12 h-12 bg-cyan-600 text-white rounded-xl flex items-center justify-center text-2xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-2xl font-semibold mb-3">Download</h3>
                <p className="text-gray-600 mb-4">
                  Get your print-ready photos instantly. Print at home or take
                  to any photo lab.
                </p>
                <div className="flex items-center space-x-2 text-sm text-cyan-600">
                  <Check className="w-4 h-4" />
                  <span>4×6 print layout included</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto px-4 py-20">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Is this service really free?",
                a: "Yes! PassportSnap is 100% free with no hidden charges. Create unlimited photos without any cost.",
              },
              {
                q: "Which countries are supported?",
                a: "We support United States, Canada, UK, Australia, India, China, Germany, France, and more countries are being added regularly.",
              },
              {
                q: "Are my photos stored on your servers?",
                a: "No, never! All photo processing happens locally in your browser. Your photos never leave your device, ensuring complete privacy.",
              },
              {
                q: "What image formats can I upload?",
                a: "We support JPEG, PNG, and HEIC (iPhone photos). The tool automatically converts HEIC files for you.",
              },
              {
                q: "Can I print these photos at home?",
                a: "Absolutely! Download the 4×6 print layout and print on any photo printer or take it to your local photo lab.",
              },
            ].map((faq, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFAQ(openFAQ === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      openFAQ === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openFAQ === i && (
                  <div className="px-6 pb-4 text-gray-600">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 py-20">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Create Your Passport Photo?
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Join thousands who trust PassportSnap for their passport photos
            </p>
            <button
              onClick={() => setStep("upload")}
              className="px-10 py-5 bg-white text-emerald-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
            >
              Start Creating Now - It's Free →
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Camera className="w-6 h-6 text-emerald-500" />
              <span className="text-xl font-bold text-white">PassportSnap</span>
            </div>
            <p className="mb-4">Professional passport photos, instantly</p>
            <p className="text-sm">
              &copy; 2025 PassportSnap. All processing happens in your browser.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Upload Page
  if (step === "upload") {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Simple Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <button
              onClick={() => setStep("landing")}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <Camera className="w-6 h-6 text-emerald-600" />
              <span className="font-bold text-xl">PassportSnap</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-12">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <span className="ml-2 font-medium text-emerald-600">
                  Upload
                </span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <span className="ml-2 font-medium text-gray-400">Edit</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <span className="ml-2 font-medium text-gray-400">Download</span>
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Choose Your Country
            </h1>
            <p className="text-lg text-gray-600">
              Select the country for your passport photo requirements
            </p>
          </div>

          {/* Country Grid */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {countries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCountry(c.code)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    country === c.code
                      ? "border-emerald-600 bg-emerald-50 shadow-md"
                      : "border-gray-200 hover:border-emerald-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-4xl mb-2">{c.flag}</div>
                  <div
                    className={`text-sm font-semibold ${
                      country === c.code ? "text-emerald-700" : "text-gray-700"
                    }`}
                  >
                    {c.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {c.widthMM}×{c.heightMM} mm
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Area */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div
              className={`border-3 border-dashed rounded-2xl p-12 transition-all cursor-pointer ${
                isProcessing
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30"
              }`}
              onClick={() => !isProcessing && fileInputRef.current?.click()}
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10 text-emerald-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {isProcessing
                    ? "Processing your photo..."
                    : "Upload Your Photo"}
                </h3>
                <p className="text-gray-600 mb-6">
                  Drag and drop or click to browse
                </p>
                {!isProcessing && (
                  <button className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
                    Choose File
                  </button>
                )}
                {isProcessing && (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                    <span className="text-emerald-700 font-medium">
                      Converting and loading...
                    </span>
                  </div>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileUpload}
              className="hidden"
            />

            {error && (
              <div className="mt-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-red-800 font-semibold">
                    Upload Error
                  </p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start space-x-3 p-4 bg-emerald-50 rounded-xl">
                <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Supported Formats
                  </p>
                  <p className="text-xs text-gray-600">
                    JPEG, PNG, HEIC (iPhone)
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-teal-50 rounded-xl">
                <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Face Forward
                  </p>
                  <p className="text-xs text-gray-600">
                    Look directly at camera
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3 p-4 bg-cyan-50 rounded-xl">
                <Check className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">
                    Good Lighting
                  </p>
                  <p className="text-xs text-gray-600">No harsh shadows</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Editor Page
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Camera className="w-6 h-6 text-emerald-600" />
            <div>
              <h1 className="font-bold text-xl text-gray-900">Photo Editor</h1>
              <p className="text-sm text-gray-600">
                {currentCountry.flag} {currentCountry.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStep("upload");
              setImage(null);
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium"
          >
            ← New Photo
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-emerald-600">
                Upload
              </span>
            </div>
            <div className="w-12 h-0.5 bg-emerald-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-emerald-600">
                Edit
              </span>
            </div>
            <div className="w-12 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-400">
                Download
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Photo Preview - Larger */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Preview</h2>
                <button
                  onClick={() => setShowGuides(!showGuides)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showGuides
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {showGuides ? "👁️ Guides On" : "👁️ Guides Off"}
                </button>
              </div>

              <div className="relative inline-block">
                <canvas
                  ref={previewCanvasRef}
                  width={passportSize.width}
                  height={passportSize.height}
                  className="border-2 border-gray-200 rounded-xl cursor-move max-w-full h-auto shadow-inner"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />

                {showGuides && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Outer boundary frame */}
                    <div className="absolute inset-0 border-2 border-emerald-500 rounded-xl"></div>

                    {/* Corner markers - enhanced */}
                    <div className="absolute -top-1 -left-1 w-6 h-6">
                      <div className="w-full h-1 bg-emerald-500"></div>
                      <div className="w-1 h-full bg-emerald-500"></div>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6">
                      <div className="w-full h-1 bg-emerald-500 ml-auto"></div>
                      <div className="w-1 h-full bg-emerald-500 ml-auto"></div>
                    </div>
                    <div className="absolute -bottom-1 -left-1 w-6 h-6">
                      <div className="w-1 h-full bg-emerald-500"></div>
                      <div className="w-full h-1 bg-emerald-500 mt-auto"></div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6">
                      <div className="w-1 h-full bg-emerald-500 ml-auto"></div>
                      <div className="w-full h-1 bg-emerald-500 ml-auto mt-auto"></div>
                    </div>

                    {/* Head oval guide — sized from the country's real spec */}
                    <div
                      className="absolute border-2 border-amber-400 rounded-full bg-amber-400/5"
                      style={{
                        left: pct(guides.ovalLeft),
                        top: pct(guides.crown),
                        width: pct(guides.ovalWidth),
                        height: pct(guides.chin - guides.crown),
                      }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-amber-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap shadow-lg">
                        Head ({Math.round(currentCountry.head[0] * 100)}–
                        {Math.round(currentCountry.head[1] * 100)}%)
                      </div>
                    </div>

                    {/* Top of head (crown) marker */}
                    <div
                      className="absolute border-t-2 border-purple-400 border-dashed"
                      style={{
                        top: pct(guides.crown),
                        left: pct(guides.ovalLeft),
                        width: pct(guides.ovalWidth),
                      }}
                    >
                      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap shadow-md">
                        Top of Head
                      </div>
                    </div>

                    {/* Eye level horizontal line */}
                    <div
                      className="absolute border-t-2 border-teal-400 border-dashed"
                      style={{ top: pct(guides.eye), left: "5%", width: "90%" }}
                    >
                      <div className="absolute -top-7 right-0 bg-teal-500 text-white text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap shadow-lg flex items-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full mr-1.5"></div>
                        Eyes Here
                      </div>
                    </div>

                    {/* Chin level line */}
                    <div
                      className="absolute border-t-2 border-rose-400 border-dashed"
                      style={{ top: pct(guides.chin), left: "5%", width: "90%" }}
                    >
                      <div className="absolute -bottom-7 right-0 bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap shadow-md">
                        Chin Level
                      </div>
                    </div>

                    {/* Center vertical line */}
                    <div
                      className="absolute border-l-2 border-emerald-400 border-dashed opacity-50"
                      style={{ left: "50%", top: "5%", height: "90%" }}
                    ></div>

                    {/* Center crosshair with enhanced styling */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <div className="w-12 h-0.5 bg-emerald-500 opacity-60"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-12 bg-emerald-500 opacity-60"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-emerald-500 rounded-full"></div>
                      </div>
                    </div>

                    {/* Side measurement ticks */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between py-4">
                      <div className="flex items-center">
                        <div className="w-4 h-0.5 bg-emerald-500"></div>
                        <div className="text-xs text-emerald-700 font-medium ml-1">
                          0%
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-0.5 bg-emerald-400"></div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-0.5 bg-emerald-500"></div>
                        <div className="text-xs text-emerald-700 font-medium ml-1">
                          50%
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-0.5 bg-emerald-400"></div>
                      </div>
                      <div className="flex items-center">
                        <div className="w-4 h-0.5 bg-emerald-500"></div>
                        <div className="text-xs text-emerald-700 font-medium ml-1">
                          100%
                        </div>
                      </div>
                    </div>

                    {/* Right side measurement ticks */}
                    <div className="absolute right-0 top-0 h-full flex flex-col justify-between py-4">
                      <div className="flex items-center justify-end">
                        <div className="text-xs text-emerald-700 font-medium mr-1">
                          0%
                        </div>
                        <div className="w-4 h-0.5 bg-emerald-500"></div>
                      </div>
                      <div className="flex items-center justify-end">
                        <div className="w-3 h-0.5 bg-emerald-400"></div>
                      </div>
                      <div className="flex items-center justify-end">
                        <div className="text-xs text-emerald-700 font-medium mr-1">
                          50%
                        </div>
                        <div className="w-4 h-0.5 bg-emerald-500"></div>
                      </div>
                      <div className="flex items-center justify-end">
                        <div className="w-3 h-0.5 bg-emerald-400"></div>
                      </div>
                      <div className="flex items-center justify-end">
                        <div className="text-xs text-emerald-700 font-medium mr-1">
                          100%
                        </div>
                        <div className="w-4 h-0.5 bg-emerald-500"></div>
                      </div>
                    </div>

                    {/* Info panel overlay - bottom right */}
                    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 max-w-xs">
                      <div className="text-xs space-y-1">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-amber-400 rounded-sm"></div>
                          <span className="text-gray-700 font-medium">
                            Head in oval ({Math.round(currentCountry.head[0] * 100)}–
                            {Math.round(currentCountry.head[1] * 100)}%)
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-1 bg-teal-400"></div>
                          <span className="text-gray-700 font-medium">
                            Eyes at line
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-1 bg-rose-400"></div>
                          <span className="text-gray-700 font-medium">
                            Chin at line
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-1 h-3 bg-emerald-400"></div>
                          <span className="text-gray-700 font-medium">
                            Center face
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      Positioning Tips
                    </p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>
                        • <strong>Drag</strong> photo to move it around
                      </li>
                      <li>
                        • <strong>Zoom</strong> slider to adjust size
                      </li>
                      <li>
                        • <strong>Center face</strong> on vertical line
                      </li>
                      <li>
                        • <strong>Eyes at teal line</strong>, chin at rose line
                      </li>
                      <li>
                        • <strong>Head fits</strong> within amber oval
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Sidebar */}
          <div className="space-y-4">
            {/* Auto Adjust */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-emerald-600" />
                Auto Adjust
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Automatically fix exposure and fit your head to{" "}
                {currentCountry.name}'s requirements.
              </p>
              <button
                onClick={autoAdjust}
                disabled={isAdjusting}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md disabled:opacity-60"
              >
                {isAdjusting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adjusting...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Auto Adjust Photo
                  </>
                )}
              </button>
              {autoMessage && (
                <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2 mt-3">
                  {autoMessage}
                </p>
              )}
              <div className="mt-3 flex items-start space-x-2 text-xs text-gray-500">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                <span>{currentCountry.note}</span>
              </div>
            </div>

            {/* Position & Scale */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <ZoomIn className="w-5 h-5 mr-2 text-emerald-600" />
                Position & Scale
              </h3>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Zoom Level
                  </label>
                  <span className="text-sm font-bold text-emerald-600">
                    {scale.toFixed(2)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="3"
                  step="0.01"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <p className="text-xs text-gray-400 mt-1">
                  1.0× fits the frame • drag the photo to position it
                </p>
              </div>
            </div>

            {/* Adjustments */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Palette className="w-5 h-5 mr-2 text-emerald-600" />
                Adjustments
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Sun className="w-4 h-4 mr-1" />
                      Brightness
                    </label>
                    <span className="text-sm font-bold text-amber-600">
                      {brightness}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Contrast className="w-4 h-4 mr-1" />
                      Contrast
                    </label>
                    <span className="text-sm font-bold text-purple-600">
                      {contrast}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={contrast}
                    onChange={(e) => setContrast(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center">
                      <Palette className="w-4 h-4 mr-1" />
                      Saturation
                    </label>
                    <span className="text-sm font-bold text-pink-600">
                      {saturation}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                  />
                </div>
              </div>

              <button
                onClick={resetAdjustments}
                className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset All
              </button>
            </div>

            {/* Download Options */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4 flex items-center">
                <Download className="w-5 h-5 mr-2" />
                Download Options
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 opacity-90">
                  Print Layout
                </label>
                <select
                  value={photoCount}
                  onChange={(e) => setPhotoCount(parseInt(e.target.value))}
                  className="w-full p-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value={4} className="text-gray-900">
                    4 Photos (2×2 grid)
                  </option>
                  <option value={6} className="text-gray-900">
                    6 Photos (2×3 grid)
                  </option>
                </select>
              </div>

              <div className="space-y-2">
                <button
                  onClick={downloadSinglePhoto}
                  className="w-full flex items-center justify-center px-4 py-3 bg-white text-emerald-700 rounded-lg font-bold hover:bg-gray-50 transition-all shadow-lg"
                >
                  <FileImage className="w-5 h-5 mr-2" />
                  Single Photo
                </button>

                <button
                  onClick={downloadPrintLayout}
                  className="w-full flex items-center justify-center px-4 py-3 bg-white/20 backdrop-blur-sm text-white border-2 border-white/50 rounded-lg font-bold hover:bg-white/30 transition-all"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  4×6 Print Sheet
                </button>
              </div>

              <p className="text-xs mt-4 opacity-80 text-center">
                High-resolution 300 DPI • Print-ready
              </p>
            </div>
          </div>
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={printCanvasRef} className="hidden" />
    </div>
  );
};

export default PassportPhotoApp;
